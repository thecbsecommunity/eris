import { Pool } from 'pg';

export async function setPrivateVC(db: Pool, channelID: string, ownerID: string): Promise<void> {
    await db.query(
        `INSERT INTO privatevc (id, ownerid)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET ownerid = EXCLUDED.ownerid`,
        [channelID, ownerID]
    );
}

export async function isPrivateVC(db: Pool, channelID: string): Promise<boolean> {
    const { rows } = await db.query(
        "SELECT 1 FROM privatevc WHERE id = $1",
        [channelID]
    );
    return rows.length > 0;
}

export async function getPrivateVCOwner(db: Pool, channelID: string): Promise<string | null> {
    const { rows } = await db.query(
        "SELECT ownerid FROM privatevc WHERE id = $1",
        [channelID]
    );
    if (rows.length === 0) {
        return null;
    }
    return rows[0].ownerid;
}


export async function deletePrivateVC(db: Pool, channelID: string): Promise<void> {
    await db.query(
        "DELETE FROM privatevc WHERE id = $1",
        [channelID]
    );
}

export async function getPrivateVCByOwner(db: Pool, ownerID: string): Promise<string | null> {
    const { rows } = await db.query(
        "SELECT id FROM privatevc WHERE ownerid = $1",
        [ownerID]
    );
    if (rows.length === 0) {
        return null;
    }
    return rows[0].id;
}

export async function getAllPrivateVCs(db: Pool): Promise<string[]> {
    const { rows } = await db.query(
        "SELECT id FROM privatevc"
    );
    return rows.map(row => row.id);
}