const { DataTypes, Model } = require('sequelize');

class Seat extends Model {
  static initModel(sequelize) {
    Seat.init({
      SeatID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      StudioID: { type: DataTypes.INTEGER, allowNull: false },
      SeatNumber: { type: DataTypes.STRING(10), allowNull: false },
      RowNumber: { type: DataTypes.STRING(5), allowNull: false },
      IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
      sequelize,
      modelName: 'Seat',
      tableName: 'Seats',
      timestamps: false,
      indexes: [
        { unique: true, fields: ['StudioID', 'SeatNumber'] }
      ]
    });
    return Seat;
  }
}

module.exports = Seat; 