const fs = require('fs');
const path = require('path');

const rootDir = require('../utils/path');

exports.deleteImageFile = (filePath) => {
  const fileName = filePath.split('/images/')[1]; 
  if (!fileName) {
    console.log('Invalid file path provided:', filePath);
    return;
  }

  const absolutePath = path.join(rootDir,'uploads' , 'images' , fileName);
  
  fs.unlink(absolutePath, err => {
    if (err) {
      console.log('Failed to delete image file:', err);
    }else{
      console.log('Image file deleted successfully:', absolutePath);   
    }
  });
}


