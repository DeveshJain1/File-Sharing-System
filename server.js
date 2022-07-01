require("dotenv").config()
const multer = require('multer');
const express = require("express")
const bcrypt = require('bcrypt');
const File = require('./models/File');
const app = express();
const upload = multer({ dest: "uploads" })
const mongoose = require('mongoose');
const download = require("./Controller/download")

app.set('views', './views/');
app.set("view engine", "ejs")
mongoose.connect(process.env.DATABASE_URL).then(() => console.log("Database connected!")).catch(err => console.log(err));
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'));


// Routes
app.get("/", (req, res) => {
     res.render("index")
})
app.post("/upload", 
upload.single("file"),
 async (req, res) => {
     const fileData = {
          path: req.file.path,
          originalName: req.file.originalname
     }
     if (req.body.password != null && req.body.password !== "") {
          fileData.password = await bcrypt.hash(req.body.password, 10)
     }
     const file = await File.create(fileData)
     res.render("index", { filelink: `${req.headers.origin}/file/${file.id}` })

})
app.route("/file/:id").get(downloadHandler).post(downloadHandler)

async function downloadHandler(req, res) {
     const file = await File.findById(req.params.id)

     if (file.password != "null") {
          if (req.body.password == null) {
               res.render("password")
               return

          }
     }
     if (!await bcrypt.compare(req.body.password, file.password)) {
          res.render("password", { error: true })
     }
     file.downloadCount++;
     await file.save()
     console.log(file.downloadCount)
     res.download(file.path, file.originalName)
}

app.listen(process.env.PORT)
