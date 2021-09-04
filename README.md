## Setup

1. ./setup.sh
2. cd into one of the folders below and run the scripts.

# binanceTaxScripts
Scripts for calculating tax obligations in AUD for Binance


## Staking Interest
Calculates the total income you've gained as part of staking bonuses. 

Under the ATO rule for 2020, it seems any staking bonus counts as general taxable income at the time of payment. Any crypto rewarded is considered as an asset with a cost basis of this income. When you then subsequently trade it or sell it, then you must pay CGT on it. 

This script only calculates the cost basis/ income in AUD at the time received.

Usage:
1. Go to Binance and export the full transaction data. Binance > Wallet > Transaction History > Generate All Statements

This provides a big CSV with format: UTC_TIME, Account, Operation, Coin, Change, Remark.

2. Copy that file into /in dir. Maybe filter to the values that say 'Savings Interest' or 'POS Saving Interests'

3. cd stakingInterest && npm start in/example.csv out
This will create a csv file in /out/example.csv with values fetched.

Note: 
Generally, it follows a conversion of Coin -> BNB -> AUD and uses the closest transactions on Binance at the time. But DOGE/BNB wasn't listed on BNB temporarily in 2020-2021. So for this pair, it goes straight DOGE->AUD.


## Trade in AUD / processBinanceTx
Calculates the AUD price and brokerage of any trade at the time of the trade.

Usage:
1. Go to Binance and export the trade data. Binance -> Orders -> Spot Order -> Trade History -> Export Trade History

This provides a CSV with format: Date(UTC),Pair,Side,Price,Executed,Amount,Fee
Verify the format has not changed.
2. Copy that file in to /in dir
3. cd tradesinAud && npm start in/example.csv out
This will create two csv files:

a) `out/example.csv` - input file with additional columns, as is.
b) `out/groups.example.csv` - group transactions that happend around the same time

The transaction history export has trades, not orders. So the `groups` file tries to combine these transactions back where possible. Sometimes its not possible when different trades are interlaced or they are executed at different prices.

After producing this file comes the hard part. In 20/21 tax, what I did was:
- Try find matching pairs of buy/sells with the same size.
- For each other entry, do a FIFO matching. If buy > sell, (i.e. i bought 10, sold 7 units), then split this into two parcels of size 7 and 3. the parcel of 7 is sold with a 70% brokerage. 
- A LIFO matching may be better in future for CGT purposes if some coins are hodl'd while others are traded. 
- This should probably be added to the script. But was done manually.