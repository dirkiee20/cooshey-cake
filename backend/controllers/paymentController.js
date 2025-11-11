
const Paymongo = require('paymongo-node');
const paymongo = new Paymongo(process.env.PAYMONGO_SECRET_KEY);

exports.createGcashSource = async (req, res) => {
    const { amount } = req.body;

    try {
        const source = await paymongo.sources.create({
            amount: amount * 100, // PayMongo requires amount in centavos
            currency: 'PHP',
            type: 'gcash',
            redirect: {
                success: 'http://localhost:5500/cart.html?payment=success',
                failed: 'http://localhost:5500/cart.html?payment=failed'
            }
        });

        res.status(200).json({ checkout_url: source.redirect.checkout_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create GCash source' });
    }
};
