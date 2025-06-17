const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TicketPrice = sequelize.define('TicketPrice', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM('default', 'custom'),
            allowNull: false,
            defaultValue: 'default'
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        dayOfWeek: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 6
            }
        },
        isHoliday: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        timestamps: true,
        indexes: [
            {
                fields: ['type']
            },
            {
                fields: ['startDate', 'endDate']
            },
            {
                fields: ['dayOfWeek']
            },
            {
                fields: ['isHoliday']
            }
        ]
    });

    TicketPrice.associate = (models) => {
        // Add any associations if needed
    };

    return TicketPrice;
}; 