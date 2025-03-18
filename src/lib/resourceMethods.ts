import { Database } from 'sqlite3';
import { filter } from 'fuzzaldrin';

export async function getResource(db: Database, id: string): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM resources WHERE id = ?", [id], (err, row: any) => {
            if (err) reject(err);
            else if (row) {
                row.usage = row.usage ? JSON.parse(row.usage) : [];
                resolve(row);
            } else resolve(null);
        });
    });
}

export async function serveResources(db: Database, tag: string = 'ALL', search: string = ''): Promise<{ name: string, value: string }[]> {
    return new Promise((resolve, reject) => {
        const query = tag === 'ALL'
            ? "SELECT id, title FROM resources WHERE status = 'active'"
            : "SELECT id, title FROM resources WHERE tag = ? AND status = 'active'";
        db.all(query, tag === 'ALL' ? [] : [tag], (err, rows: any[]) => {
            if (err) reject(err);
            let resources = rows.map(row => ({ name: row.title, value: row.id }));
            if (search) {
                resources = filter(resources, search, { key: 'name' });
            }
            console.log(`serveResources: tag=${tag}, search=${search}, results=${resources.length}`);
            resolve(resources.slice(0, 25));
        });
    });
}

export async function getAverageRating(db: Database, resourceID: string): Promise<number | string> {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT rating FROM reviews WHERE resource_id = ?",
            [resourceID],
            (err, rows: any[]) => {
                if (err) reject(err);
                if (!rows || rows.length === 0) resolve("Unrated");
                const totalRatings = rows.reduce((acc, row) => acc + (row.rating || 0), 0);
                resolve(totalRatings / rows.length);
            }
        );
    });
}

export async function hasRated(db: Database, resourceID: string, userID: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT 1 FROM reviews WHERE resource_id = ? AND reviewer = ?",
            [resourceID, userID],
            (err, row) => {
                if (err) reject(err);
                resolve(!!row);
            }
        );
    });
}

export async function rateResource(
    db: Database, resourceID: string, reviewer: string, rating: number, comment: string
): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;
    if (rating < 1) rating = 1;
    if (rating > 5) rating = 5;

    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO reviews (resource_id, reviewer, rating, comment) VALUES (?, ?, ?, ?)",
            [resourceID, reviewer, rating, comment],
            (err) => {
                if (err) {
                    console.error(`Error adding review for resource ${resourceID}:`, err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

export async function deleteResource(db: Database, resourceID: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET status = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            ['deleted', staffActionBy, Math.floor(Date.now() / 1000), resourceID],
            (err) => {
                if (err) {
                    console.error(`Error deleting resource ${resourceID}:`, err);
                    resolve(false);
                } else {
                    console.log(`Resource ${resourceID} marked as deleted by ${staffActionBy}`);
                    resolve(true);
                }
            }
        );
    });
}
export async function editTitle(db: Database, resourceID: string, newTitle: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;
    resource.title = newTitle;
    resource.staffActionBy = staffActionBy;
    resource.staffActionAt = Math.floor(Date.now() / 1000);

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET title = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            [newTitle, staffActionBy, resource.staffActionAt, resourceID],
            (err) => {
                if (err) {
                    console.error(`Error updating title for ${resourceID}:`, err);
                    resolve(false);
                } else {
                    console.log(`Resource ${resourceID} title updated to "${newTitle}" by ${staffActionBy}`);
                    resolve(true);
                }
            }
        );
    });
}

export async function editTag(db: Database, resourceID: string, newTag: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;
    resource.tag = newTag;
    resource.staffActionBy = staffActionBy;
    resource.staffActionAt = Math.floor(Date.now() / 1000);

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET tag = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            [newTag, staffActionBy, resource.staffActionAt, resourceID],
            (err) => {
                if (err) {
                    console.error(`Error updating tag for ${resourceID}:`, err);
                    resolve(false);
                } else {
                    console.log(`Resource ${resourceID} tag updated to "${newTag}" by ${staffActionBy}`);
                    resolve(true);
                }
            }
        );
    });
}

export async function editDescription(db: Database, resourceID: string, newDescription: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;
    resource.description = newDescription;
    resource.staffActionBy = staffActionBy;
    resource.staffActionAt = Math.floor(Date.now() / 1000);

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET description = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            [newDescription, staffActionBy, resource.staffActionAt, resourceID],
            (err) => {
                if (err) {
                    console.error(`Error updating description for ${resourceID}:`, err);
                    resolve(false);
                } else {
                    console.log(`Resource ${resourceID} description updated by ${staffActionBy}`);
                    resolve(true);
                }
            }
        );
    });
}

export async function editUrl(db: Database, resourceID: string, newUrl: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;
    resource.url = newUrl;
    resource.staffActionBy = staffActionBy;
    resource.staffActionAt = Math.floor(Date.now() / 1000);

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET url = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            [newUrl, staffActionBy, resource.staffActionAt, resourceID],
            (err) => {
                if (err) {
                    console.error(`Error updating URL for ${resourceID}:`, err);
                    resolve(false);
                } else {
                    console.log(`Resource ${resourceID} URL updated to "${newUrl}" by ${staffActionBy}`);
                    resolve(true);
                }
            }
        );
    });
}

export async function editAuthor(db: Database, resourceID: string, newAuthor: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;
    resource.author = newAuthor;
    resource.staffActionBy = staffActionBy;
    resource.staffActionAt = Math.floor(Date.now() / 1000);

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET author = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            [newAuthor, staffActionBy, resource.staffActionAt, resourceID],
            (err) => {
                if (err) {
                    console.error(`Error updating author for ${resourceID}:`, err);
                    resolve(false);
                } else {
                    console.log(`Resource ${resourceID} author updated to "${newAuthor}" by ${staffActionBy}`);
                    resolve(true);
                }
            }
        );
    });
}

export async function getActiveResourceCountByUser(db: Database, userID: string): Promise<number> {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT COUNT(*) as count FROM resources WHERE author = ? AND status = 'active'",
            [userID],
            (err, row: any) => err ? reject(err) : resolve(row.count)
        );
    });
}

export async function getTotalResourceCountByUser(db: Database, userID: string): Promise<number> {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT COUNT(*) as count FROM resources WHERE author = ?",
            [userID],
            (err, row: any) => err ? reject(err) : resolve(row.count)
        );
    });
}

export async function getAverageRatingByUser(db: Database, userID: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT r.rating 
             FROM reviews r 
             JOIN resources res ON r.resource_id = res.id 
             WHERE res.author = ?`,
            [userID],
            (err, rows: any[]) => {
                if (err) reject(err);
                if (!rows.length) resolve(null);
                const total = rows.reduce((acc, row) => acc + (row.rating || 0), 0);
                resolve(total / rows.length);
            }
        );
    });
}

export async function getReviewCountByUser(db: Database, userID: string): Promise<number> {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT COUNT(*) as count FROM reviews WHERE reviewer = ?",
            [userID],
            (err, row: any) => err ? reject(err) : resolve(row.count)
        );
    });
}

export async function addTemporaryResource(
    db: Database, title: string, tag: string, url: string, description: string, author: string
): Promise<string> {
    const resourceID = await generateResourceID(db);
    const createdAt = Math.floor(Date.now() / 1000);
    const desc = description === "" ? null : description;

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO resources (
                id, title, tag, url, description, author, created_at, staff_action_at, 
                staff_action_by, usage, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                resourceID, title, tag, url, desc, author, createdAt, null,
                null, JSON.stringify([]), 'pending'
            ],
            (err) => {
                if (err) {
                    console.error('Error adding temporary resource:', err);
                    reject(err);
                } else {
                    resolve(resourceID);
                }
            }
        );
    });
}

export async function approveTemporaryResource(db: Database, resourceID: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET status = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            ['active', staffActionBy, Math.floor(Date.now() / 1000), resourceID],
            (err) => {
                if (err) {
                    console.error(`Error approving resource ${resourceID}:`, err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

export async function declineTemporaryResource(db: Database, resourceID: string, staffActionBy: string): Promise<boolean> {
    const resource = await getResource(db, resourceID);
    if (!resource) return false;

    return new Promise((resolve) => {
        db.run(
            "UPDATE resources SET status = ?, staff_action_by = ?, staff_action_at = ? WHERE id = ?",
            ['deleted', staffActionBy, Math.floor(Date.now() / 1000), resourceID],
            (err) => {
                if (err) {
                    console.error(`Error declining resource ${resourceID}:`, err);
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        );
    });
}

export async function generateResourceID(db: Database): Promise<string> {
    return new Promise((resolve, reject) => {
        db.all("SELECT id FROM resources", [], (err, rows: any[]) => {
            if (err) return reject(err);
            const existingResourceIds = rows.map(row => row.id);
            const upperString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numberString = '0123456789';
            let resourceId = '';

            while (!resourceId || existingResourceIds.includes(resourceId)) {
                resourceId = 
                    upperString.charAt(Math.floor(Math.random() * upperString.length)) +
                    upperString.charAt(Math.floor(Math.random() * upperString.length)) +
                    numberString.charAt(Math.floor(Math.random() * numberString.length)) +
                    numberString.charAt(Math.floor(Math.random() * numberString.length)) +
                    numberString.charAt(Math.floor(Math.random() * numberString.length));
            }
            resolve(resourceId);
        });
    });
}