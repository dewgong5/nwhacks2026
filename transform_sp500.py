"""
Transform S&P 500 daily CSV files into a single CSV with 12 monthly data points.

Reads individual stock CSVs from sp500_companies folder and outputs a combined CSV
with the first trading day of each month for the last 12 months.
"""

import os
import pandas as pd
from pathlib import Path

# Paths
INPUT_DIR = Path(r"C:\Users\dethan\Projects\sp500_companies")
OUTPUT_FILE = Path(__file__).parent / "stocks_sp500.csv"

# Company name and sector mappings for common stocks
COMPANY_INFO = {
    "AAPL": ("Apple Inc", "Technology"),
    "MSFT": ("Microsoft Corp", "Technology"),
    "GOOGL": ("Alphabet Inc", "Technology"),
    "GOOG": ("Alphabet Inc", "Technology"),
    "AMZN": ("Amazon.com Inc", "Consumer"),
    "NVDA": ("NVIDIA Corp", "Technology"),
    "META": ("Meta Platforms", "Technology"),
    "TSLA": ("Tesla Inc", "Consumer"),
    "BRK-B": ("Berkshire Hathaway", "Finance"),
    "JPM": ("JPMorgan Chase", "Finance"),
    "V": ("Visa Inc", "Finance"),
    "UNH": ("UnitedHealth Group", "Healthcare"),
    "JNJ": ("Johnson & Johnson", "Healthcare"),
    "XOM": ("Exxon Mobil", "Energy"),
    "MA": ("Mastercard Inc", "Finance"),
    "PG": ("Procter & Gamble", "Consumer"),
    "HD": ("Home Depot", "Consumer"),
    "CVX": ("Chevron Corp", "Energy"),
    "ABBV": ("AbbVie Inc", "Healthcare"),
    "MRK": ("Merck & Co", "Healthcare"),
    "LLY": ("Eli Lilly", "Healthcare"),
    "PEP": ("PepsiCo Inc", "Consumer"),
    "KO": ("Coca-Cola Co", "Consumer"),
    "COST": ("Costco Wholesale", "Consumer"),
    "AVGO": ("Broadcom Inc", "Technology"),
    "WMT": ("Walmart Inc", "Consumer"),
    "MCD": ("McDonald's Corp", "Consumer"),
    "CSCO": ("Cisco Systems", "Technology"),
    "TMO": ("Thermo Fisher", "Healthcare"),
    "ABT": ("Abbott Labs", "Healthcare"),
    "ACN": ("Accenture plc", "Technology"),
    "DHR": ("Danaher Corp", "Healthcare"),
    "ORCL": ("Oracle Corp", "Technology"),
    "NKE": ("Nike Inc", "Consumer"),
    "PFE": ("Pfizer Inc", "Healthcare"),
    "DIS": ("Walt Disney Co", "Consumer"),
    "NFLX": ("Netflix Inc", "Technology"),
    "AMD": ("AMD Inc", "Technology"),
    "INTC": ("Intel Corp", "Technology"),
    "CRM": ("Salesforce Inc", "Technology"),
    "ADBE": ("Adobe Inc", "Technology"),
    "QCOM": ("Qualcomm Inc", "Technology"),
    "TXN": ("Texas Instruments", "Technology"),
    "IBM": ("IBM Corp", "Technology"),
    "INTU": ("Intuit Inc", "Technology"),
    "BA": ("Boeing Co", "Industrial"),
    "CAT": ("Caterpillar Inc", "Industrial"),
    "GE": ("General Electric", "Industrial"),
    "HON": ("Honeywell Intl", "Industrial"),
    "UPS": ("United Parcel Service", "Industrial"),
    "RTX": ("RTX Corp", "Industrial"),
    "GS": ("Goldman Sachs", "Finance"),
    "MS": ("Morgan Stanley", "Finance"),
    "C": ("Citigroup Inc", "Finance"),
    "BAC": ("Bank of America", "Finance"),
    "WFC": ("Wells Fargo", "Finance"),
    "AXP": ("American Express", "Finance"),
    "BLK": ("BlackRock Inc", "Finance"),
    "SCHW": ("Charles Schwab", "Finance"),
    "SPGI": ("S&P Global", "Finance"),
    "T": ("AT&T Inc", "Telecom"),
    "VZ": ("Verizon Comm", "Telecom"),
    "TMUS": ("T-Mobile US", "Telecom"),
    "NEE": ("NextEra Energy", "Utilities"),
    "DUK": ("Duke Energy", "Utilities"),
    "SO": ("Southern Co", "Utilities"),
    "SLB": ("Schlumberger", "Energy"),
    "COP": ("ConocoPhillips", "Energy"),
    "EOG": ("EOG Resources", "Energy"),
    "LIN": ("Linde plc", "Materials"),
    "APD": ("Air Products", "Materials"),
    "SHW": ("Sherwin-Williams", "Materials"),
    "F": ("Ford Motor Co", "Consumer"),
    "GM": ("General Motors", "Consumer"),
    "SBUX": ("Starbucks Corp", "Consumer"),
    "LOW": ("Lowe's Companies", "Consumer"),
    "TGT": ("Target Corp", "Consumer"),
    "BKNG": ("Booking Holdings", "Consumer"),
    "MAR": ("Marriott Intl", "Consumer"),
    "ABNB": ("Airbnb Inc", "Consumer"),
    "UBER": ("Uber Technologies", "Technology"),
    "PYPL": ("PayPal Holdings", "Technology"),
    "SQ": ("Block Inc", "Technology"),
    "NOW": ("ServiceNow Inc", "Technology"),
    "SNOW": ("Snowflake Inc", "Technology"),
    "PANW": ("Palo Alto Networks", "Technology"),
    "CRWD": ("CrowdStrike Holdings", "Technology"),
    "ZS": ("Zscaler Inc", "Technology"),
    "DDOG": ("Datadog Inc", "Technology"),
    "COIN": ("Coinbase Global", "Finance"),
    "PLTR": ("Palantir Technologies", "Technology"),
}

# Sector mappings by ticker prefix/patterns
SECTOR_PATTERNS = {
    "Technology": ["AAPL", "MSFT", "GOOG", "NVDA", "META", "AMD", "INTC", "CRM", "ADBE", "ORCL"],
    "Healthcare": ["UNH", "JNJ", "PFE", "MRK", "ABBV", "LLY", "TMO", "ABT", "DHR", "BMY"],
    "Finance": ["JPM", "BAC", "WFC", "GS", "MS", "C", "BLK", "AXP", "V", "MA"],
    "Consumer": ["AMZN", "TSLA", "WMT", "HD", "MCD", "NKE", "SBUX", "TGT", "COST", "PG"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "OXY", "PSX", "VLO", "MPC", "HAL"],
    "Industrial": ["BA", "CAT", "GE", "HON", "UPS", "RTX", "LMT", "DE", "MMM", "UNP"],
}


def get_company_info(ticker: str) -> tuple[str, str]:
    """Get company name and sector for a ticker."""
    if ticker in COMPANY_INFO:
        return COMPANY_INFO[ticker]
    
    # Try to guess sector from patterns
    for sector, tickers in SECTOR_PATTERNS.items():
        if ticker in tickers:
            return (ticker, sector)
    
    # Default
    return (ticker, "Other")


def process_stock_csv(filepath: Path) -> dict | None:
    """Process a single stock CSV file and extract monthly prices."""
    ticker = filepath.stem  # Filename without extension
    
    try:
        # Read CSV, skip the second row (ticker repeat header)
        df = pd.read_csv(filepath, skiprows=[1])
        
        # Parse dates
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        
        # Use Close price (or Adj Close if Close is missing)
        price_col = 'Close' if 'Close' in df.columns else 'Adj Close'
        
        # Extract year-month and get first trading day of each month
        df['YearMonth'] = df['Date'].dt.to_period('M')
        monthly = df.groupby('YearMonth').first().reset_index()
        
        # Get last 12 months
        monthly = monthly.tail(12)
        
        if len(monthly) < 12:
            print(f"  Warning: {ticker} only has {len(monthly)} months of data")
            # Pad with the earliest available price
            while len(monthly) < 12:
                first_price = monthly.iloc[0][price_col]
                # Create a dummy row
                dummy = monthly.iloc[0:1].copy()
                dummy[price_col] = first_price
                monthly = pd.concat([dummy, monthly], ignore_index=True)
        
        # Extract prices (oldest to newest)
        prices = monthly[price_col].tolist()
        current_price = prices[-1] if prices else 100.0
        
        # Get company info
        name, sector = get_company_info(ticker)
        
        return {
            'ticker': ticker,
            'name': name,
            'sector': sector,
            'prices': prices,  # 12 prices, oldest first
            'current_price': current_price
        }
        
    except Exception as e:
        print(f"  Error processing {ticker}: {e}")
        return None


def main():
    print(f"Reading S&P 500 data from: {INPUT_DIR}")
    print(f"Output file: {OUTPUT_FILE}")
    print()
    
    # Find all CSV files
    csv_files = list(INPUT_DIR.glob("*.csv"))
    print(f"Found {len(csv_files)} stock files")
    print()
    
    # Process each file
    results = []
    for i, filepath in enumerate(csv_files):
        if i % 50 == 0:
            print(f"Processing {i}/{len(csv_files)}...")
        
        result = process_stock_csv(filepath)
        if result:
            results.append(result)
    
    print(f"\nSuccessfully processed {len(results)} stocks")
    
    # Build output DataFrame
    rows = []
    for r in results:
        row = {
            'ticker': r['ticker'],
            'name': r['name'],
            'sector': r['sector'],
        }
        # Add 12 monthly prices (oldest to newest: month_12 to month_1)
        for i, price in enumerate(r['prices']):
            month_num = 12 - i  # month_12 is oldest, month_1 is newest
            row[f'price_{month_num}'] = round(float(price), 2)
        
        row['current_price'] = round(float(r['current_price']), 2)
        rows.append(row)
    
    # Create DataFrame and save
    columns = ['ticker', 'name', 'sector'] + [f'price_{i}' for i in range(12, 0, -1)] + ['current_price']
    df_out = pd.DataFrame(rows)
    df_out = df_out[columns]  # Reorder columns
    
    df_out.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved to: {OUTPUT_FILE}")
    print(f"Total stocks: {len(df_out)}")
    
    # Show sample
    print("\nSample output (first 5 rows):")
    print(df_out.head().to_string())


if __name__ == "__main__":
    main()
