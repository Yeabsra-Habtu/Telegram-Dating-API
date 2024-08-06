export enum SettingNameEnum {
  CronJobTimeInterval = "CronJobTimeInterval",
  RackingCoin = "RackingCoin",
  CoinPerSuggestion = "CoinPerSuggestion",
  ShareCoin = "ShareCoin",
  OneCoinInBirr = "OneCoinInBirr",
  MinimumWithdrawableCoin = "MinimumWithdrawableCoin",
}
export interface ISetting {
  name: SettingNameEnum;
  value: number;
}
