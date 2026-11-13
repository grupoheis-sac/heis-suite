import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const PlanSaaS = sequelize.define('PlanSaaS', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  precio_mensual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 99.00,
  },
  badge: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  alcance: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'planes_saas',
  timestamps: true,
});

export default PlanSaaS;

