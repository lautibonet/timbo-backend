const catchObjectIdError = (error, trueCallback, falseCallback) => {
    (error && error.kind == 'ObjectId' && error.name == 'CastError') ? trueCallback() : falseCallback();
}

module.exports = catchObjectIdError;