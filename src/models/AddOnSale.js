const { DataTypes, Model } = require('sequelize');

class AddOnSale extends Model {
  static initModel(sequelize) {
    AddOnSale.init({
      AddOnSaleID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      BookingID: { type: DataTypes.INTEGER, allowNull: false },
      AddOnID: { type: DataTypes.INTEGER, allowNull: false },
      Quantity: { type: DataTypes.INTEGER, allowNull: false },
      UnitPrice: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    }, {
      sequelize,
      modelName: 'AddOnSale',
      tableName: 'AddOnSales',
      timestamps: false,
    });
    return AddOnSale;
  }
}

module.exports = AddOnSale; 