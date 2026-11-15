import type { Database } from '../database';
import type { Category, CategoryKind } from '../types';

const COLUMNS = 'id, name, kind, icon, color';

/** Categorias fixas, na ordem em que foram criadas; `kind` filtra despesa ou receita. */
export function listCategories(db: Database, kind?: CategoryKind): Promise<Category[]> {
  return kind
    ? db.getAllAsync<Category>(`SELECT ${COLUMNS} FROM categories WHERE kind = ? ORDER BY rowid`, [kind])
    : db.getAllAsync<Category>(`SELECT ${COLUMNS} FROM categories ORDER BY rowid`, []);
}

export function getCategory(db: Database, id: string): Promise<Category | null> {
  return db.getFirstAsync<Category>(`SELECT ${COLUMNS} FROM categories WHERE id = ?`, [id]);
}
