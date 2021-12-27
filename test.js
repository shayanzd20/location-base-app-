const express = require('express');

const app = express();
const PORT = process.env.PORT || 4455

app.get('/',function (req, res) {


    let typeArray = [
        "art": Arts,
        "beauty": Beauties,
        "education": Educations,
        "entertainment": Entertainments,
        "health": Healths,
        "restaurant": Restaurants,
        "services": Services
    ];

})

app.listen(PORT, () => {
    console.log('Server is running on PORT:',PORT);
});