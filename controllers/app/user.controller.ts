import { Request, Response } from "express";
import { okRes, errRes, getOTP,hashMyPassword } from "../../helpers/tools";
import * as validate from "validate.js";
import validation from "../../helpers/validation.helper";
import { User } from "../../src/entity/User";
import PhoneFormat from "../../helpers/phone.helper";

const bcrypt = require('bcrypt');
var jwt = require("jsonwebtoken");

/**
 *
 */
export default class UserController {
  /**
   *
   * @param req
   * @param res
   */
  

  static async register(req: Request, res: Response): Promise<object> {
    let notValid = validate(req.body, validation.register());
    if (notValid) return errRes(res, notValid);
    let phoneObj = PhoneFormat.getAllFormats(req.body.phone);
    if (!phoneObj.isNumber)
      return errRes(res, `Phone ${req.body.phone} is not a valid`);

    let user: any;

    try {
      user = await User.findOne({ where: { phone: req.body.phone } });
      if (user) return errRes(res, `Phone ${req.body.phone} already exists`);
    } catch (error) {
      return errRes(res, error);
    }


    const hash = await hashMyPassword(req.body.password);

    user = await User.create({
      ...req.body,
      password:hash,
      active: true,
      complete: false,
      otp: getOTP(),
    });
  
    await user.save();
    var token = jwt.sign({ id: user.id }, "shhhhh");
    return okRes(res, {user,token});
  }
  

  static async otp(req: Request, res: Response): Promise<object>{
    
    let notValid = validate(req.body, validation.otp());
    if (notValid) return errRes(res, notValid);
    let user = await User.findOne({ where: { phone: req.body.phone } }); // brings user through his phone

    if (req.body.otp != user.otp ){
      return errRes(res, " otp dose not match")
    }

    else{
      user.complete= true;
      user.save()

      return okRes ( res, " succ" )
    }

  }
  static async login(req: Request, res: Response): Promise<object>{
    let notValid = validate(req.body, validation.login());
    if (notValid) return errRes(res, notValid);
    let user = await User.findOne({where: {phone: req.body.phone }})

    if (!user) return errRes(res,` Phone ${req.body.phone} dose not exist, REISTER`);

    if (user.complete == false){
      return errRes(res," f off")

    }



    bcrypt.compare(req.body.password, user.password, function(err, result) {
      if (result) {
        var token = jwt.sign({ id: user.id }, "shhhhh");
            return okRes(res, {token} )
      } else {
        errRes(res, "pass is wrong " )
      }

      

  });
   }

  


}
