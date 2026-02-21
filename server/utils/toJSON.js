export function toJSON(doc, opts = {}) {
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id?.toString();
    delete obj._id;
    delete obj.__v;

    if (opts.refs) {
        for (const key of opts.refs) {
            if (obj[key] != null) obj[key] = obj[key].toString();
        }
    }

    if (opts.dates) {
        for (const key of opts.dates) {
            if (obj[key]) obj[key] = new Date(obj[key]).toISOString().slice(0, 10);
        }
    }

    return obj;
}
