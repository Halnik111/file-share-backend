import {getDownloadURL, listAll, ref, uploadBytes} from "firebase/storage";
import {storage} from "../../firebase.js";
import File from "../models/File.js";

export const uploadFiles = async (req, res) => {
    try {
        const accessCode = await generateAccessCode();
        console.log('Access Code: ' +  accessCode);


        const files = req.body.files;

        const dbFile = await File.create({
            name: accessCode,
            files: []
        });



        const promises = [];

        for(const file of files) {
            promises.push(await uploadFile(file, accessCode))
        }

        Promise.all(promises).then(refs => {
            refs.forEach(ref => {
                File.findOneAndUpdate({name: accessCode}, {
                    $push: {
                        files: {
                            ref
                        }
                    }
                })
            });
            console.log(dbFile.files);

            // await File.findByIdAndUpdate('64ea5249d38a6c63d7246597', {
            //     $push: {takenIds: accessCode}
            // }, {new: true})
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



    //upload file to Firebase
    return await uploadBytes(fileRef, fileBuffer)
        .then(async () => {
            return {
                url: await getDownloadURL(fileRef),
                name: file.name,
            }
        });


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

export const getFilesFromDB = async (req, res) => {
    // await File.create({
    //     name: req.params.id,
    //     folders: [{
    //         name: 'test',
    //         folders: [{
    //             name: 'innerFolder',
    //             files: [{
    //                 name: 'text.txt',
    //                 size: '7450',
    //                 url: 'https://firebasestorage.googleapis.com/v0/b/file-share-e0908.appspot.com/o/files%2F2028%2Ftest%2FinnerFolder%2Ftext.txt?alt=media&token=4676dee4-a1a8-453a-9e84-10cfc3cf111a'
    //             }]
    //         }],
    //         files: [{
    //             name: 'text.txt',
    //             size: '7450',
    //             url: 'https://firebasestorage.googleapis.com/v0/b/file-share-e0908.appspot.com/o/files%2F2028%2Ftest%2Ftext.txt?alt=media&token=385cf97f-8962-4814-8aaa-e9f76e82a6e7'
    //         }],
    //     }],
    //     files: [{
    //         name: 'something.txt',
    //         size: '12500',
    //         url: 'https://firebasestorage.googleapis.com/v0/b/file-share-e0908.appspot.com/o/files%2F2028%2Fsomething.txt?alt=media&token=b37cb040-c4be-43b8-a52c-86535b156707'
    //     }]
    // })

    try {
        const id = req.params.id;
        const data = await File.findOne({name: id});
        res.status(200).json(data);
    }
    catch (err) {
        res.status(500).json(err.message);
    }

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
    // const takenIds = data.takenIds;
    // return takenIds.includes(num) ? generateAccessCode() : num;
    return num;
}

