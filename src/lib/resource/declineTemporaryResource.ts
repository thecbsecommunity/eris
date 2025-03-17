import { db } from '../firebase';

async function declineTemporaryResource(
    resourceID: string,
    staffActionBy: string
): Promise<boolean> {
    const resource = await db.collection('resources').doc(resourceID).get();
    if (!resource.exists) return false;
    
    const data = resource.data() as { [key: string]: any };
    data.status = 'deleted';
    data.staffActionAt = Date.now();
    data.staffActionBy = staffActionBy;
    
    await db.collection('resources').doc(resourceID).set(data);
    return true;
}

export { declineTemporaryResource };