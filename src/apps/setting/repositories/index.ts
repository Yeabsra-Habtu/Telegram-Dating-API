import { SettingNameEnum } from "../interfaces";
import { SettingModel } from "../models";

export default class SettingRepository {
  public static async createDefault() {
    // check if default settings exist, if not create default settings
    if (
      (await SettingModel.findOne({
        name: SettingNameEnum.CronJobTimeInterval,
      })) == null
    )
      await SettingModel.create({
        name: SettingNameEnum.CronJobTimeInterval,
        value: 3,
      });
    if (
      (await SettingModel.findOne({ name: SettingNameEnum.RackingCoin })) ==
      null
    )
      await SettingModel.create({
        name: SettingNameEnum.RackingCoin,
        value: 1000,
      });
    if (
      (await SettingModel.findOne({
        name: SettingNameEnum.CoinPerSuggestion,
      })) == null
    )
      await SettingModel.create({
        name: SettingNameEnum.CoinPerSuggestion,
        value: 10,
      });
    if (
      (await SettingModel.findOne({
        name: SettingNameEnum.ShareCoin,
      })) == null
    )
      await SettingModel.create({
        name: SettingNameEnum.ShareCoin,
        value: 400,
      });
    if (
      (await SettingModel.findOne({
        name: SettingNameEnum.OneCoinInBirr,
      })) == null
    )
      await SettingModel.create({
        name: SettingNameEnum.OneCoinInBirr,
        value: 1,
      });
    if (
      (await SettingModel.findOne({
        name: SettingNameEnum.MinimumWithdrawableCoin,
      })) == null
    )
      await SettingModel.create({
        name: SettingNameEnum.MinimumWithdrawableCoin,
        value: 100,
      });
  }

  public static async cronJobTimeInterval() {
    return (
      await SettingModel.findOne({ name: SettingNameEnum.CronJobTimeInterval })
    )?.value;
  }
}
