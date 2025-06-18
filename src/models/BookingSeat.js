const { DataTypes, Model } = require('sequelize');

class BookingSeat extends Model {
  static initModel(sequelize) {
    BookingSeat.init({
      BookingSeatID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      BookingID: { type: DataTypes.INTEGER, allowNull: false },
      SeatID: { type: DataTypes.INTEGER, allowNull: false },
    }, {
      sequelize,
      modelName: 'BookingSeat',
      tableName: 'BookingSeats',
      timestamps: false,
      indexes: [
        { unique: true, fields: ['BookingID', 'SeatID'] }
      ]
    });
    return BookingSeat;
  }
}

module.exports = BookingSeat; 