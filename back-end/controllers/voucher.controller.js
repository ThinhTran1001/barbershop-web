const Voucher = require("../models/voucher.model")

exports.createVoucher = async(req,res) =>{
    try {
        const voucher = new Voucher(req.body)
        const newVoucher = await voucher.save();
        res.status(201).json(newVoucher);
    } catch (error) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
    }
}


exports.getAllVoucher = async(req,res) =>{
    try {
        const allVoucher = await Voucher.find();
        res.status(200).json(allVoucher)
    } catch (error) {
     res.status(500).json({ success: false, message: error.message });

    }
}


exports.getSingerVoucher = async(req,res) =>{
    try {
        const oneVoucher = await Voucher.findById(req.params.id);
        if (!oneVoucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found' });
    }
    res.status(200).json({
      success: true,
      data: oneVoucher,
    });
    } catch (error) {
    res.status(500).json({ success: false, message: error.message });  
    }
}

exports.updateVoucher = async(req,res) =>{
    try {
        const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body,{new: true, runValidators : true});
           if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Update successful',
      data: voucher,
    });
    } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    }
}

exports.deleteVoucher = async(req,res) =>{
    try {
        const voucher = await Voucher.findByIdAndDelete(req.params.id);
        if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }
    res.status(200).json({ success: true, message: "Voucher deleted successfully" });
    } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    }
}