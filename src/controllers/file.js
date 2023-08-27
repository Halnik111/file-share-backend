import {ref, uploadBytes, updateMetadata, getDownloadURL, listAll} from "firebase/storage";
import {storage} from "../../firebase.js";
import File from "../models/File.js";

export const upload = async (req, res) => {
    try {
        const accessCode = await generateAccessCode();

        const fileRef = ref(storage, `files/${accessCode}/${req.body.name}`);
        const base64 = req.body.file.split(';base64,');
        const fileHeader = base64[0].split(":")[1];
        const fileBuffer = Buffer.from(base64[1], 'base64');



        console.log(fileHeader);
        console.log(req.body.file.length);
        console.log('Access Code: ' +  accessCode);
        await uploadBytes(fileRef, fileBuffer);
        // await updateMetadata(fileRef, {contentType: fileHeader});
        await File.findByIdAndUpdate('64ea5249d38a6c63d7246597', {
            $push: {takenIds: accessCode}
        }, {new: true})

        res.status(200).json("Access Code: " + accessCode);
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

export const getFiles = async (req, res) => {
    try {
        const id = req.params.id;
        const dirRef = ref(storage, `files/${id}`);
        console.log(id)
        await listAll(dirRef).then(ref => {
            console.log(ref.items[0].name)
             getDownloadURL(ref.items[0])
                .then(url => {
                    const file = [{
                        name: ref.items[0].name,
                        url: url
                    }]
                    res.status(200).json(file)
                })
        })
            .catch(err => {
                res.status(404).json('no such file');
            })

    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

const generateAccessCode = async () => {
    const num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const data = await File.findById('64ea5249d38a6c63d7246597');
    const takenIds = data.takenIds;
    return takenIds.includes(num) ? generateAccessCode() : num;
}

