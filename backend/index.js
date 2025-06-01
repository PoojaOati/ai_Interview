
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/generate-questions', (req, res) => {
    const { skills, experience } = req.body;

    if (!skills || !experience) {
        return res.status(400).json({ error: 'Skills and experience are required.' });
    }

    const skillList = skills.split(',').map(skill => skill.trim());

    const questions = skillList.map(skill => {
        return [
            `Can you explain your experience with ${skill}?`,
            `What challenges have you faced while working with ${skill}?`,
            `How would you use ${skill} in a large-scale project?`,
            `What advanced concepts in ${skill} have you worked with?`
        ];
    }).flat();

    // Shuffle the questions to make them more dynamic
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 8); // return 8 random questions

    res.json({ questions: selected });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
