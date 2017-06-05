/*
 * @description
 *   Please write the json script's description
 * @author Zhang(rdshoep@126.com)
 *   http://www.rdshoep.com/
 * @version 
 *   1.0.0(6/5/2017)
 */

module.exports = function (err, data) {
    if (err) {
        return {
            success: false,
            msg: err.message
        }
    } else {
        return JSON.parse(data);
    }
}