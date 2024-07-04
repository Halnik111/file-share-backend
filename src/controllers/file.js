import {getDownloadURL, listAll, ref, uploadBytes} from "firebase/storage";
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

        Promise.all(promises).then(async () => {
            await File.findByIdAndUpdate('64ea5249d38a6c63d7246597', {
                $push: {takenIds: accessCode}
            }, {new: true})
        })
            .then(() => {
                console.log('Done');
                res.status(201).json(accessCode);
            })
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

export const getFiles = async (req, res) => {
    try {
        const id = req.params.id.replaceAll("@", "/");
        const dirRef = ref(storage, `files/${id}`);
        const directory = await listAll(dirRef);
        if (directory.items.length === 0) {
            res.status(404).json('no such file')
            return;
        }

        const promises = [];

        for (const fileRef of directory.items) {
            await getFile(fileRef).then(files => console.log(files.name));
            promises.push(getFile(fileRef))
        }

        for (const folderRef of directory.prefixes) {
            promises.push(getFolder(folderRef))
        }

        Promise.all(promises).then(files => {
            const fileList = [];
            const folderList = [];
            files.forEach(file => {
                if (file.url) {
                    fileList.push(file)
                }
                else {
                    folderList.push(file)
                }
            })
            res.status(200).json({
                id: id,
                files: fileList,
                folders: folderList
            })
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
};

const getFile = async (ref) => {
    return await getDownloadURL(ref)
        .then(url => {
            return {
                url: url,
                name: ref.name}
        })
}

export const getFileTest = async (req, res) => {
    const dirRef = ref(storage, `files/${req.params.id}`);
    const directory = await listAll(dirRef);

    const thisOne = directory.items[0];
    await getDownloadURL(thisOne)
        .then(url => {
            res.status(200).json({
                id: req.params.id,
                url: url,
                name: thisOne.name
            })
        })
}

const getFolder = async (ref) => {
    const path = ref.fullPath.substring(6).replaceAll("/", "@");
    console.log(path)
    return {
        storage: path,
        name: ref.name
    }
}

const generateAccessCode = async () => {
    const num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const data = await File.findById('64ea5249d38a6c63d7246597');
    const takenIds = data.takenIds;
    return takenIds.includes(num) ? generateAccessCode() : num;
}

