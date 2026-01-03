const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🌱 Start seeding...');
        const password = await bcrypt.hash('test1234', 10);

        // 1. Create Users
        console.log('Adding users...');
        const users = [
            ['Jean Artisan', 'artisan@test.com', password, 'artisan', 'Bujumbura', 'Burundi', 60, 1],
            ['Marie Particulier', 'marie@test.com', password, 'particulier', 'Gitega', 'Burundi', 10, 0],
            ['Quincaillerie Moderne', 'shop@test.com', password, 'commercant', 'Bujumbura', 'Burundi', 25, 0]
        ];

        for (const u of users) {
            const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [u[1]]);
            if (exists.length === 0) {
                await db.execute(
                    'INSERT INTO users (nom, email, password, type_compte, ville, pays, points_contribution, badge_fiable) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    u
                );
            }
        }

        const [[artisan]] = await db.execute('SELECT id FROM users WHERE email = ?', ['artisan@test.com']);
        const [[marie]] = await db.execute('SELECT id FROM users WHERE email = ?', ['marie@test.com']);
        const [[shop]] = await db.execute('SELECT id FROM users WHERE email = ?', ['shop@test.com']);

        // 2. Add Price Submissions in Bujumbura
        console.log('Adding price submissions...');
        const submissions = [
            [artisan.id, 1, 38500, 'Quartier Industriel', 'Bujumbura', 'Mairie', -3.3750, 29.3620, '2025-12-28', 'Dépôt Central'],
            [marie.id, 1, 39000, 'Kamenge Market', 'Bujumbura', 'Mairie', -3.3550, 29.3820, '2025-12-30', 'Retailer'],
            [shop.id, 1, 38000, 'Avenue du Large', 'Bujumbura', 'Mairie', -3.3950, 29.3520, '2026-01-02', 'Showroom'],
            [artisan.id, 4, 4500, 'Zone Industrielle', 'Bujumbura', 'Mairie', -3.3700, 29.3600, '2026-01-01', 'Acierie du Burundi'],
            [marie.id, 3, 250, 'Ngagara', 'Bujumbura', 'Mairie', -3.3600, 29.3700, '2025-12-25', 'Briqueterie Artisanale']
        ];

        for (const s of submissions) {
            await db.execute(`
                INSERT INTO soumissions_prix 
                (user_id, materiau_id, prix, lieu, ville, region, latitude, longitude, date_achat, source, statut)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valide')
            `, s);
        }

        // 3. Add Some interactions
        console.log('Adding interactions...');
        const [[recentSub]] = await db.execute('SELECT id FROM soumissions_prix ORDER BY id DESC LIMIT 1');

        // Artisan comments on a submission
        await db.execute('INSERT INTO commentaires (user_id, soumission_id, commentaire) VALUES (?, ?, ?)',
            [artisan.id, recentSub.id, "C'est un bon prix pour la brique artisanale à Ngagara."]
        );

        // Artisan votes
        await db.execute('INSERT INTO votes (user_id, soumission_id, type_vote) VALUES (?, ?, ?)',
            [artisan.id, recentSub.id, 'positif']
        );
        await db.execute('UPDATE soumissions_prix SET votes_positifs = votes_positifs + 1 WHERE id = ?', [recentSub.id]);

        console.log('✅ Seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
