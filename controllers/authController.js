const authService = require("../services/authService");

const login = async (req, res) => {

    try {

        const { login, password, rol } = req.body;

        const result = await authService.login(login, password, rol);

        res.json(result);

    } catch (error) {

        res.status(401).json({
            message: error.message
        });

    }

};

module.exports = {
    login
};