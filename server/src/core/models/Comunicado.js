import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const Comunicado = sequelize.define('Comunicado', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('info', 'alerta', 'mantenimiento', 'exito'),
    defaultValue: 'info',
  },
  formato: {
    type: DataTypes.ENUM('banner', 'modal', 'toast'),
    defaultValue: 'banner',
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media',
  },
  plan_objetivo: {
    type: DataTypes.ENUM('todos', 'starter', 'professional', 'enterprise'),
    defaultValue: 'todos',
  },
  cta_texto: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  cta_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  visto_contador: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null = Global para todos los tenants
  },
  creado_por: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'SuperAdmin HEIS',
  },
}, {
  tableName: 'comunicados',
  timestamps: true,
});

export default Comunicado;

