const { DataTypes, Model } = require('sequelize');

class Booking extends Model {
  static initModel(sequelize) {
    Booking.init({
      BookingID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      UserID: { type: DataTypes.INTEGER, allowNull: false },
      ShowtimeID: { type: DataTypes.INTEGER, allowNull: false },
      BookingDateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      TotalAmount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
      Status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Confirmed' },
    }, {
      sequelize,
      modelName: 'Booking',
      tableName: 'Bookings',
      timestamps: false,
    });
    return Booking;
  }
}

module.exports = Booking; 