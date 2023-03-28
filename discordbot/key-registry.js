module.exports = class KeyRegistry {
    constructor() {
        this.keys = new Map();
    }

    add(userId, key) {
        this.keys.set(userId, key);
    }

    get(userId) {
        return this.keys.get(userId);
    }

    remove(userId) {
        this.keys.delete(userId);
    }
};