const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['booking', 'payment', 'system', 'promo', 'maintenance']]
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        data: {
            type: DataTypes.JSON,
            defaultValue: {}
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true,
        indexes: [
            {
                fields: ['userId', 'createdAt']
            },
            {
                fields: ['type']
            },
            {
                fields: ['read']
            }
        ]
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return Notification;
}; 