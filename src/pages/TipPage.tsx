import "./TipPage.css";

const BASE = import.meta.env.BASE_URL;

const tipLinks = {
  five: "https://square.link/u/hTXxiTfK",
  ten: "https://square.link/u/04gWsv5P",
  twenty: "https://square.link/u/GXcwa9jm",
  custom: "https://square.link/u/NvnGkuD1",
  venmo: "https://venmo.com/REPLACE-WITH-YOUR-VENMO",
  cashApp: "https://cash.app/$REPLACEWITHYOURCASHTAG",
};

export default function TipPage() {
  return (
    <div className="tip-page-shell">
      <main className="tip-page" aria-labelledby="tip-page-title">
        <img src={`${BASE}tip/path16.png`} alt="Rikki's Mobile Bar" className="tip-header-image" />

        <h1 id="tip-page-title">Tap at the bar is fastest</h1>
        <p className="tip-intro">Choose an amount to tip your bartender.</p>

        <div className="tip-amount-grid" aria-label="Tip amounts">
          <a className="tip-amount" href={tipLinks.five}>
            $5
          </a>
          <a className="tip-amount tip-amount-featured" href={tipLinks.ten}>
            <span className="tip-amount-label">Most popular</span>
            $10
          </a>
          <a className="tip-amount" href={tipLinks.twenty}>
            $20
          </a>
        </div>

        <div className="tip-buttons">
          <a className="tip-button" href={tipLinks.custom}>
            <span>Enter custom amount</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
          <a className="tip-button tip-button-secondary" href={tipLinks.venmo}>
            <span>Tip with Venmo</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
          <a className="tip-button tip-button-secondary" href={tipLinks.cashApp}>
            <span>Tip with Cash App</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        <p className="tip-note">All tips go directly to your bartenders. Thank you for supporting Rikki's.</p>

        <div className="tip-footer">Tap. Scan. Sip.</div>
      </main>
    </div>
  );
}
