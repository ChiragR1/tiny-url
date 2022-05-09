const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk = require('monk');
const { nanoid } = require('nanoid');
require('dotenv').config();

const db = monk(process.env.MONGO_URL);
const urls = db.get('urls');
urls.indexes().then((indexes) => {

    console.log(indexes);
    urls.dropIndex({ slug: 1 }, { unique: true });
    urls.createIndex({ slug: 1 }, { unique: true });
})


const app = express();

app.use(helmet());
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.static('./public'));

const schema = yup.object().shape({
    slug: yup.string().trim().matches(/[\w\-]/i),
    url: yup.string().trim().url().required()
})

app.get('/', (req, res) => {
    res.json({
        message: 'short urls'
    });
});

app.post('/url', async (req, res, next) => {
    let { slug, url } = req.body;
    try {
        await schema.validate({ slug, url });
        if (!slug) {
            slug = nanoid(5);
        }
        else {
            const existing = await urls.findOne({ slug });
            if (esisting) {
                throw new Error('Slug is in use')
            }
        }
        slug = slug.toLowerCase();
        const secret = nanoid(10).toLowerCase();
        const newUrl = { url, slug, secret };

        const created = await urls.insert(newUrl);
        res.json(created);
    } catch (ex) {

        next(ex);
    }
});

app.use((error, req, res, next) => {

    res.status(error.status ?? 500);

    res.json({
        message: error.message,
        stack: process.env.NODE_ENV == 'production' ? '🥞' : error.stack
    })
})

app.get('/:id', async (req, res, next) => {
    const { id: slug } = req.params;
    try {
        const url = await urls.findOne({ slug })
        if (url) {
            res.redirect(url.url);
        } else {
            res.redirect(`/?error=${slug} not found`);
        }
    } catch (ex) {
        console.error(ex);
        res.redirect(`/?error=Link not found`);
    }
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
});