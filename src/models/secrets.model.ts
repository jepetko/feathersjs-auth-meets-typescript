export interface SecretAttrs {
  value: string;
}

/**
 * instance
 * Note: id, created_at, updated_at are auto-added by Sequelize
 */
export interface Secret extends SecretAttrs {
  id: number;
  created_at?: Date;
  updated_at?: Date;
}
