// Register drink builder: shared by Abe's iPad (to show prices) and the server (to charge them).
// Plain JS with drinkBuilder.d.ts so the Vercel functions can import it without a TS step.
// The config is passed in (drinkBuilder.json) so the browser and Node can each load it their own way.

const MAX_PER_LINE = 10;

/**
 * Menu items marked "upgrade": "tequila" also exist as Don Julio versions, e.g.
 * "salsa-lunazul-margarita--dj-blanco" ("Margarita · Don Julio Blanco", +$3). The guest QR menu
 * shows them under the drink; the server accepts them like any item; each has its own recipe
 * (the Lunazul pour swapped for the Don Julio bottle).
 */
export function expandMenu(config, menu) {
  const variants = [];
  for (const item of menu) {
    const upgrade = item.upgrade && config.upgrades?.[item.upgrade];
    if (!upgrade) continue;
    for (const option of upgrade.options) {
      variants.push({
        ...item,
        id: `${item.id}--${option.id}`,
        name: `${item.name} · ${option.name}`,
        ...(item.name_es ? { name_es: `${item.name_es} · ${option.name}` } : {}),
        priceCents: item.priceCents + option.priceCents,
        description: item.description?.replace(/Lunazul blanco tequila/i, `${option.name} tequila`),
        ...(item.description_es ? { description_es: item.description_es.replace(/Tequila Lunazul blanco/i, `Tequila ${option.name}`) } : {}),
        upgrade: undefined,
        variantOf: item.id,
        upgradeOption: option.id,
      });
    }
  }
  return [...menu, ...variants];
}

/** Groups that apply to a style (and to a signature, through its style). */
export function groupsFor(config, styleId) {
  return config.groups
    .filter((group) => (!group.styles || group.styles.includes(styleId)) && !(group.exceptStyles ?? []).includes(styleId))
    .map((group) => ({ ...group, options: group.options.filter((option) => !option.styles || option.styles.includes(styleId)) }));
}

/** The selections a new drink starts with: each group's default, then the style's own defaults. */
export function defaultMods(config, styleId) {
  const style = config.styles.find((item) => item.id === styleId);
  const mods = {};
  for (const group of groupsFor(config, styleId)) {
    const preset = style?.defaults?.[group.id] ?? group.default;
    if (preset !== undefined) mods[group.id] = group.select === "many" ? [].concat(preset) : preset;
    else if (group.select === "many") mods[group.id] = [];
  }
  return mods;
}

function cleanNote(note) {
  if (note === undefined || note === null || note === "") return "";
  if (typeof note !== "string" || note.length > 60) throw new Error("Keep the note under 60 characters.");
  // Commas separate drinks on the bar ticket, so keep them out of a single drink's text.
  return note.replace(/[,\n\r]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Price one ticket line and work out what it takes from inventory.
 * line: { kind: "build", liquor, style, mods, note, quantity } or { kind: "item", id, mods, note, quantity }
 * menu: the event's simple menu items ({ id, name, priceCents }).
 * Returns { unitCents, quantity, label, mods: [text], text, components: [{ id, name }] } or throws an Error with a message for staff.
 */
export function priceLine(config, menu, line) {
  if (!line || typeof line !== "object") throw new Error("Check the ticket.");
  const quantity = line.quantity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_LINE) throw new Error("Quantities must be 1 to 10.");
  const note = cleanNote(line.note);

  let unitCents;
  let label;
  let styleId;
  let liquor = null;
  const components = [];

  if (line.kind === "build") {
    liquor = config.liquors.find((item) => item.id === line.liquor);
    const style = config.styles.find((item) => item.id === line.style);
    if (!liquor || !style) throw new Error("Choose a liquor and how it's served.");
    const tier = config.tiers[liquor.tier];
    styleId = style.id;
    // Shots have their own prices (shotPrices); every other style is the liquor's tier price.
    unitCents = style.id === "shot" && config.shotPrices
      ? config.shotPrices[liquor.id] ?? config.shotPrices.default
      : tier.priceCents + (style.priceCents ?? 0);
    label = style.label.replace("{liquor}", liquor.name);
    components.push({ id: `b-pour-${liquor.id}`, name: `${liquor.name} pour` });
    components.push({ id: `b-style-${style.id}`, name: style.name });
  } else if (line.kind === "item") {
    const item = menu.find((entry) => entry.id === line.id);
    if (!item) throw new Error("That item isn't on this menu. Refresh the register.");
    const signature = config.signatures[item.id];
    styleId = signature?.style ?? null;
    liquor = signature ? config.liquors.find((entry) => entry.id === signature.liquor) ?? null : null;
    unitCents = item.priceCents;
    label = item.name;
    // Register: "upgrade" swaps the house tequila for a Don Julio bottle (the drink's Don Julio version).
    const upgradeId = line.mods?.upgrade;
    const upgrade = item.upgrade && config.upgrades?.[item.upgrade];
    if (upgradeId !== undefined && upgradeId !== "house") {
      const option = upgrade?.options.find((entry) => entry.id === upgradeId);
      if (!option) throw new Error(`${item.name} can't be upgraded that way.`);
      const variant = menu.find((entry) => entry.id === `${item.id}--${option.id}`);
      if (!variant) throw new Error("That upgrade isn't on this menu. Refresh the register.");
      unitCents = variant.priceCents;
      label = variant.name;
      liquor = config.liquors.find((entry) => entry.id === option.liquor) ?? liquor;
      components.push({ id: variant.id, name: variant.name });
    } else {
      components.push({ id: item.id, name: item.name });
    }
    const otherMods = Object.keys(line.mods ?? {}).filter((key) => key !== "upgrade");
    if (!signature && otherMods.length) throw new Error(`${item.name} has no options.`);
  } else {
    throw new Error("Check the ticket.");
  }

  const modText = [];
  if (styleId) {
    const style = config.styles.find((item) => item.id === styleId);
    const groups = groupsFor(config, styleId);
    const defaults = defaultMods(config, styleId);
    const { upgrade: _upgrade, ...optionMods } = line.mods ?? {};
    void _upgrade;
    const chosen = { ...defaults, ...optionMods };
    for (const key of Object.keys(optionMods)) {
      if (!groups.some((group) => group.id === key)) throw new Error("That option doesn't apply to this drink.");
    }
    for (const group of groups) {
      const value = chosen[group.id];
      const picked = group.select === "many" ? value ?? [] : value === undefined ? [] : [value];
      if (group.select === "many" && !Array.isArray(picked)) throw new Error(`Check ${group.name}.`);
      if (group.select === "one" && (typeof value !== "string" || picked.length !== 1)) throw new Error(`Choose ${group.name}.`);
      if (new Set(picked).size !== picked.length) throw new Error(`Check ${group.name}.`);
      const presets = [].concat(style?.defaults?.[group.id] ?? group.default ?? []);
      for (const optionId of picked) {
        const option = group.options.find((entry) => entry.id === optionId);
        if (!option) throw new Error(`Check ${group.name}.`);
        if (option.double) {
          if (!liquor) throw new Error("This drink can't be made a double.");
          unitCents += config.tiers[liquor.tier].doubleCents;
          components.push({ id: `b-double-${liquor.id}`, name: `${liquor.name} double` });
        }
        unitCents += option.priceCents ?? 0;
        // The style's recipe already covers its defaults (salt on a margarita, a wedge on a mule).
        if (!presets.includes(optionId)) {
          modText.push(option.name);
          if (option.recipe?.length) components.push({ id: `b-mod-${group.id}-${option.id}`, name: option.name });
        }
      }
      // Show when a default was taken away, e.g. "No salt rim" style changes read as the new option.
      for (const preset of presets) {
        if (group.select === "many" && !picked.includes(preset)) {
          const option = group.options.find((entry) => entry.id === preset);
          if (option) modText.push(`No ${option.name.toLowerCase()}`);
        }
      }
    }
  } else if (line.mods && Object.keys(line.mods).some((key) => key !== "upgrade")) {
    throw new Error("This item has no options.");
  }
  if (note) modText.push(`"${note}"`);

  const text = `${quantity} × ${label}${modText.length ? " — " + modText.join(" · ") : ""}`;
  return { unitCents, quantity, label, mods: modText, text, components };
}

/**
 * Price a whole ticket. Returns { amountCents, drink, displayLines, items } where items are the
 * inventory component lines (summed per component) that the database deducts on payment.
 */
export function priceTicket(config, menu, lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 25) throw new Error("Add at least one item (25 lines at most).");
  const priced = lines.map((line) => priceLine(config, menu, line));
  const totals = new Map();
  for (const line of priced) {
    for (const component of line.components) {
      const entry = totals.get(component.id) ?? { id: component.id, name: component.name, quantity: 0, price_cents: 0 };
      entry.quantity += line.quantity;
      totals.set(component.id, entry);
    }
  }
  for (const entry of totals.values()) {
    if (entry.quantity > MAX_PER_LINE) throw new Error(`More than 10 × ${entry.name} on one ticket. Split it into two orders.`);
  }
  // Simple items keep their price on the line for sales reporting; built drinks are priced on the display line.
  for (const line of priced) {
    const simple = line.components.length === 1 && totals.get(line.components[0].id);
    if (simple && !line.mods.length) simple.price_cents = line.unitCents;
  }
  const drink = priced.map((line) => line.text).join(", ");
  if (drink.length > 1000) throw new Error("Split this order into smaller groups of drinks.");
  return {
    amountCents: priced.reduce((sum, line) => sum + line.unitCents * line.quantity, 0),
    drink,
    displayLines: priced.map((line) => ({ name: line.label, mods: line.mods, quantity: line.quantity, unit_price_cents: line.unitCents })),
    items: [...totals.values()],
  };
}

/** Inventory recipe for each component id, for scripts/build-drink-recipes.mjs. */
export function componentRecipes(config) {
  const rows = [];
  for (const liquor of config.liquors) {
    rows.push([`b-pour-${liquor.id}`, liquor.id, config.pourOz]);
    rows.push([`b-double-${liquor.id}`, liquor.id, config.pourOz]);
  }
  for (const style of config.styles) {
    const id = `b-style-${style.id}`;
    rows.push([id, "cup", 1]);
    if (style.iced) rows.push([id, "ice", 5]);
    for (const [sku, amount] of style.recipe) rows.push([id, sku, amount]);
  }
  for (const group of config.groups) {
    for (const option of group.options) {
      for (const [sku, amount] of option.recipe ?? []) rows.push([`b-mod-${group.id}-${option.id}`, sku, amount]);
    }
  }
  return rows;
}
