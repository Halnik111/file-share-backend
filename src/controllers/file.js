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
        const id = req.params.id;
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

        (await getFolders(dirRef, promises)).forEach(item => getFolders(item,promises));


        Promise.all(promises).then(files => {
            // console.log(files)
            res.status(200).json({
                id: id,
                files: files
            })
        })
    }
    catch (err) {
        res.status(500).json(err.message);
    }
}

const getFolders = async (ref, promises) => {
    promises.push(listAll(ref)).prefixes;
    const a = (await listAll(ref)).prefixes;
    a.forEach(item => console.log(item.name))

}

const searchFolders = async (directory, promises, folder) => {

    for (const dirRef of directory.prefixes) {
        const innerFiles = await listAll(dirRef);
        for (const file of innerFiles.items) {
            await getFile(file).then(result => folder.files.push(result));
        }

        if (innerFiles.prefixes.length !== 0) {
            folder.childFolders.push(searchFolders(innerFiles, promises));
        }
        // else {
        //     promises.push(folder);
        // }
        console.log(folder);


        if (directory.prefixes.length === 0)
            return promises.push(folder);
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

const generateAccessCode = async () => {
    const num = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
    const data = await File.findById('64ea5249d38a6c63d7246597');
    const takenIds = data.takenIds;
    return takenIds.includes(num) ? generateAccessCode() : num;
}

