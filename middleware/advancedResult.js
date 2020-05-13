const advancedResults = (model, populate) => async (req, res, next) => {
    // copying req query
    const reqQuery = {...req.query};
    console.log(reqQuery);
    
    // fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // loop over remove fields and delete them from query
    removeFields.forEach(param => delete reqQuery[param]);

    // create query string
    let queryStr = JSON.stringify(reqQuery);

    // create operator ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`); 

    // finding resource 
    let query = model.find(JSON.parse(queryStr));

    // finding select
    if(req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // sort
    if(req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');        
    }

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
    const total = await model.countDocuments();

    query = query.skip(startIndex).limit(limit);

    if(populate) {
        query = query.populate(populate);
    }

    // pagination result
    const pagination = {};
    if(endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }
    if(startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }
    // executing query
    const result = await query;

    res.advancedResults = {
        success: true,
        count: result.length,
        pagination,
        data: result
    } 

    next();
}

module.exports = advancedResults;