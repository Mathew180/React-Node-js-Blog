import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(express.urlencoded({ extended: false }));

app.use(express.json())

const withDB = async (operations,  res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-blog');
    
       await operations(db);

        client.close();
    
       } catch (error) {
           res.status(500).json({ message: 'Error connecting to database', error})
       }
}

app.get('/api/articles/:name', async (req,res) => {
   withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db.collection('articles').findOne({name : articleName});
    res.status(200).json(articleInfo);

   }, res);

})

app.post('/api/articles/:name/upvote', async (req,res) => {
    try {
     const articleName = req.params.name;
     const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
    
        const db = client.db('my-blog');
    
        const articleInfo = await db.collection('articles').findOne({name : articleName })

        await db.collection('articles').updateOne({ name: articleName} ,{
            '$set' : {
             upvotes : articleInfo.upvotes += 1,
            },
          });
        const updatedArticleInfo = await db.collection('articles').findOne({name : articleName })

      res.status(200).json(updatedArticleInfo)

      client.close()
       } catch (error) {
        res.status(500).json({ message: 'Error connecting to database', error})
       }
    // articlesInfo[articleName].upvotes += 1;
    // res.status(200).send(`${articleName}  now has  ${articlesInfo[articleName].upvotes} upvotes`);
});

app.post('/api/articles/:name/add-comment', async (req,res) => {
     const { username, text } = req.body;
     const articleName = req.params.name;

     withDB(async (db) => {
       const articleInfo = await db.collection('articles').findOne({name : articleName})
       await db.collection('articles').updateOne({name: articleName}, {
           '$set': {
               comments: articleInfo.comments.concat({ username,text })
           },
       });
       const updatedArticleInfo =  await db.collection('articles').findOne({name : articleName})
        res.status(200).send(updatedArticleInfo);
     }, res)
})

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

//%USERPROFILE%AppDataLocalMicrosoftWindowsApps
// app.get('/hello', (req,res)=> res.send('Hello'))
// app.get('/hello/:name', (req,res) => res.send(`Hello ${req.params.name}`))

// app.post('/hello', (req,res)=> res.send(`Hello ${req.body.name} And Am A ${req.body.job}`))

console.log("Hello world")

app.listen(8000, ()=> console.log("listening on port 8000"))

