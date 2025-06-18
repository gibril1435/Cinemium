const { Sequelize } = require('sequelize');
const User = require('./User');
const Movie = require('./Movie');
const Studio = require('./Studio');
const Showtime = require('./Showtime');
const Seat = require('./Seat');
const Booking = require('./Booking');
const BookingSeat = require('./BookingSeat');
const AddOn = require('./AddOn');
const AddOnSale = require('./AddOnSale');
const Promotion = require('./Promotion');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  logging: false,
});

// Initialize models
User.initModel(sequelize);
Movie.initModel(sequelize);
Studio.initModel(sequelize);
Showtime.initModel(sequelize);
Seat.initModel(sequelize);
Booking.initModel(sequelize);
BookingSeat.initModel(sequelize);
AddOn.initModel(sequelize);
AddOnSale.initModel(sequelize);
Promotion.initModel(sequelize);

// Associations
Movie.hasMany(Showtime, { foreignKey: 'MovieID' });
Showtime.belongsTo(Movie, { foreignKey: 'MovieID' });

Studio.hasMany(Showtime, { foreignKey: 'StudioID' });
Showtime.belongsTo(Studio, { foreignKey: 'StudioID' });

Studio.hasMany(Seat, { foreignKey: 'StudioID' });
Seat.belongsTo(Studio, { foreignKey: 'StudioID' });

Showtime.hasMany(Booking, { foreignKey: 'ShowtimeID' });
Booking.belongsTo(Showtime, { foreignKey: 'ShowtimeID' });

User.hasMany(Booking, { foreignKey: 'UserID' });
Booking.belongsTo(User, { foreignKey: 'UserID' });

Booking.hasMany(BookingSeat, { foreignKey: 'BookingID' });
BookingSeat.belongsTo(Booking, { foreignKey: 'BookingID' });

Seat.hasMany(BookingSeat, { foreignKey: 'SeatID' });
BookingSeat.belongsTo(Seat, { foreignKey: 'SeatID' });

Booking.hasMany(AddOnSale, { foreignKey: 'BookingID' });
AddOnSale.belongsTo(Booking, { foreignKey: 'BookingID' });

AddOn.hasMany(AddOnSale, { foreignKey: 'AddOnID' });
AddOnSale.belongsTo(AddOn, { foreignKey: 'AddOnID' });

module.exports = {
  sequelize,
  User,
  Movie,
  Studio,
  Showtime,
  Seat,
  Booking,
  BookingSeat,
  AddOn,
  AddOnSale,
  Promotion,
}; 