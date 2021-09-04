# binanceTaxScripts
Scripts for calculating tax obligations in AUD for Binance


# Staking Interest
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


