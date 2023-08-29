import {ref, uploadBytes, updateMetadata, getDownloadURL, listAll} from "firebase/storage";
import {storage} from "../../firebase.js";
import File from "../models/File.js";

export const uploadFiles = async (req, res) => {
    try {
        const accessCode = await generateAccessCode();
        console.log('Access Code: ' +  accessCode);


        const files = req.body.files;
        const promises = [];

        for(const file of files) {
            promises.push(await uploadFile(file, accessCode))
        }

        Promise.all(promises).then(() => {
            console.log('Done')
            File.findByIdAndUpdate('64ea5249d38a6c63d7246597', {
                $push: {takenIds: accessCode}
            }, {new: true})

            res.status(201).json("Access Code: " + accessCode);
        })
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
        await listAll(dirRef).then(async ref => {
            const files = [];
            for (let i = 0; i < ref.items.length; i++) {
                getDownloadURL(ref.items[i])
                    .then(url => {
                        const file = {
                            name: ref.items[i].name,
                            url: url
                        }
                        files.push(file);
                        if (i === ref.items.length - 1) {
                            res.status(200).json({
                                id:id,
                                files: files
                            })
                        }
                    })
            }
        }).catch(() => {
            res.status(404).json('no such file');
        })
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

const uploadFile = async (file, accessCode) => {
    const fileRef = ref(storage, `files/${accessCode}/${file.name}`);
    const base64 = file.data.split(';base64,');
    const fileHeader = base64[0].split(":")[1];
    const fileBuffer = Buffer.from(base64[1], 'base64');

    console.log(file.name)

    await uploadBytes(fileRef, fileBuffer);
    // await updateMetadata(fileRef, {contentType: fileHeader});
}

const generateAccessCode = async () => {
    const num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const data = await File.findById('64ea5249d38a6c63d7246597');
    const takenIds = data.takenIds;
    return takenIds.includes(num) ? generateAccessCode() : num;
}

