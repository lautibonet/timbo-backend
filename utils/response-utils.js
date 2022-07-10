class Ex {
    constructor(code, message){
        this.code = code;
        this.message = message;
    }
}

module.exports = {
    setUnauthorizedError: (res) => { 
        res.status(401).json({ error: new Ex('UNAUTHORIZED', '') });
    },
    setForbiddenError: (res) => { 
        res.status(403).json({ error: new Ex('FORBIDDEN', '') });
    },
    setUserNotFound: (res, id) => { 
        res.status(404).json({ error: new Ex('USER_NOT_FOUND', `User with id ${id} was not found`) });
    },
    setUserBySocialNotFound: (res, id) => { 
        res.status(404).json({ error: new Ex('USER_NOT_FOUND', `User with social id ${id} was not found`) });
    },
    setRequesterNotFound: (res, id) => { 
        res.status(404).json({ error: new Ex('REQUESTER_NOT_FOUND', `User with id ${id} was not found`) });
    },
    setRecipientNotFound: (res, id) => { 
        res.status(404).json({ error: new Ex('RECIPIENT_NOT_FOUND', `User with id ${id} was not found`) });
    },
    setMatchNotFound: (res, id) => { 
        res.status(404).json({ error: new Ex('MATCH_NOT_FOUND', `Match with id ${id} was not found`) });
    },
    setServerError: (res, error) => { 
        res.status(500).json({ error: new Ex('SERVER_ERROR', error) });
    },
    setRequiredParamError: (res, paramName) => { 
         res.status(400).json({ error: new Ex('MISSING_REQUIRED_PARAMETER', `${paramName} is required`) });
    },
    setUserOrPasswordError: (res) => { 
        res.status(400).json({ error: new Ex('WRONG_USER_OR_PASSWORD', '') });
    },
    setExistingEmailError: (res) => { 
        res.status(400).json({ error: new Ex('EMAIL_ALREADY_REGISTERED', '') });
    },
    setJoiValidationError: (res, joiError) => {
        const errorType = joiError.details[0].type;
        switch(errorType) {
            case 'string.min': res.status(400).json({ error: new Ex('MIN_LENGTH_REQUIRED', `${joiError.details[0].context.key} must be at least ${joiError.details[0].context.limit} characters long`) }); break;
            case 'any.required': res.status(400).json({ error: new Ex('MISSING_REQUIRED_PARAMETER', `${joiError.details[0].context.key} is required`) }); break;
        }
    }
}