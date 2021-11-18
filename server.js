require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

//momgoose
const mongoUrl = process.env.MONGOURL;
mongoose.connect(mongoUrl, () => console.log('connected to mongo'));

//mongoose schema
const urlSchema = new mongoose.Schema({
	original_url: String,
	short_url: Number,
});

//mongoose model
const urlModel = mongoose.model('urls', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

//
app.post('/api/shorturl', function (req, res) {
	let original = req.body.url;
	//check if original url is valid
	dns.lookup(urlParser.parse(original).hostname, async (err, address) => {
		if (!address) {
			res.json({ error: 'invalid url' });
		} else {
			//is valid
			try {
				//check if already exists
				const exists = await urlModel.find(
					{ original_url: original },
					{ original_url: 1, short_url: 1, _id: 0 }
				);
				//get database length
				const dbLength = await urlModel.find().count();
				console.log(dbLength, 'count');
				if (exists.length === 0) {
					//upload to mongodb
					const newUrl = new urlModel({
						original_url: original,
						short_url: dbLength + 1,
					});
					newUrl.save();
					console.log(newUrl, 'newUrl');
					res.json(newUrl);
				} else {
					res.json(exists[0]);
				}
			} catch (err) {
				console.log(err);
			}
		}
	});
});

app.get('/api/shorturl/:url', async function (req, res) {
	const short_urlParams = req.params.url;
	console.log(short_urlParams, 'params');
	try {
		//check if exists
		const exists = await urlModel.find({ short_url: parseInt(short_urlParams) });
		console.log(exists);
		if (exists.length === 0) {
			res.json({ error: 'Url not found' });
		} else {
			res.redirect(exists[0].original_url);
		}
	} catch (error) {
		res.json({ error: 'error in mongoDB' });
	}
});

app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
