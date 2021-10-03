const axios = require(`axios`);

const sendAuthRequest = () => {
    const url = `https://api.github.com/user`;
    const config = {
        headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
    };
    axios.get(url, config).then((response) => {
        console.log(response.data);
    });
}