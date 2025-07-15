const Barber = require('../models/barber.model');
const BarberSchedule = require('../models/barber-schedule.model');
const BarberAbsence = require('../models/barber-absence.model');

/**
 * Service để tự động tạo BarberSchedule cho các ngày tới
 * Chạy khi khởi động ứng dụng hoặc theo lịch trình
 */
class ScheduleInitializerService {
    
    /**
     * Tạo schedule cho tất cả barber trong số ngày tới
     * @param {number} daysAhead - Số ngày tạo trước (mặc định 7 ngày)
     */
    static async initializeSchedules(daysAhead = 7) {
        try {
            console.log(`[ScheduleInitializer] Bắt đầu tạo schedule cho ${daysAhead} ngày tới...`);
            
            // Lấy tất cả barber đang hoạt động
            const barbers = await Barber.find({ isAvailable: true }).select('_id preferredWorkingHours');
            
            if (barbers.length === 0) {
                console.log('[ScheduleInitializer] Không có barber nào để tạo schedule');
                return;
            }
            
            console.log(`[ScheduleInitializer] Tìm thấy ${barbers.length} barber hoạt động`);
            
            // Tạo danh sách ngày cần tạo schedule
            const dates = this.generateDateRange(daysAhead);
            
            let createdCount = 0;
            let skippedCount = 0;
            
            // Tạo schedule cho từng barber và từng ngày
            for (const barber of barbers) {
                for (const date of dates) {
                    const result = await this.createScheduleIfNotExists(barber, date);
                    if (result.created) {
                        createdCount++;
                    } else {
                        skippedCount++;
                    }
                }
            }
            
            console.log(`[ScheduleInitializer] Hoàn thành! Tạo mới: ${createdCount}, Bỏ qua: ${skippedCount}`);
            
        } catch (error) {
            console.error('[ScheduleInitializer] Lỗi khi khởi tạo schedule:', error);
        }
    }
    
    /**
     * Tạo schedule cho một barber trong một ngày cụ thể nếu chưa tồn tại
     * @param {Object} barber - Thông tin barber
     * @param {string} date - Ngày theo format YYYY-MM-DD
     */
    static async createScheduleIfNotExists(barber, date) {
        try {
            // Kiểm tra xem đã có schedule cho ngày này chưa
            const existingSchedule = await BarberSchedule.findOne({
                barberId: barber._id,
                date: date
            });
            
            if (existingSchedule) {
                return { created: false, reason: 'Already exists' };
            }
            
            // Kiểm tra xem barber có nghỉ phép trong ngày này không
            const absence = await BarberAbsence.findOne({
                barberId: barber._id,
                startDate: { $lte: new Date(date) },
                endDate: { $gte: new Date(date) },
                status: 'approved'
            });
            
            // Lấy giờ làm việc ưa thích của barber hoặc dùng mặc định
            const workingHours = {
                start: barber.preferredWorkingHours?.start || "09:00",
                end: barber.preferredWorkingHours?.end || "18:00"
            };
            
            // Tạo schedule mới
            const newSchedule = new BarberSchedule({
                barberId: barber._id,
                date: date,
                workingHours: workingHours,
                isOffDay: !!absence,
                offReason: absence ? absence.reason : null,
                slotDuration: 30 // 30 phút mỗi slot
            });
            
            // Nếu không phải ngày nghỉ, tạo các slot thời gian
            if (!absence) {
                newSchedule.generateDefaultSlots();
            }
            
            await newSchedule.save();
            
            return { 
                created: true, 
                barberId: barber._id, 
                date: date,
                isOffDay: !!absence
            };
            
        } catch (error) {
            console.error(`[ScheduleInitializer] Lỗi tạo schedule cho barber ${barber._id} ngày ${date}:`, error);
            return { created: false, reason: 'Error', error: error.message };
        }
    }
    
    /**
     * Tạo danh sách ngày từ hôm nay đến số ngày tới
     * @param {number} daysAhead - Số ngày tạo trước
     * @returns {string[]} - Mảng ngày theo format YYYY-MM-DD
     */
    static generateDateRange(daysAhead) {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < daysAhead; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Format thành YYYY-MM-DD
            const dateString = date.toISOString().split('T')[0];
            dates.push(dateString);
        }
        
        return dates;
    }
    
    /**
     * Tạo schedule cho một barber cụ thể trong khoảng thời gian
     * @param {string} barberId - ID của barber
     * @param {number} daysAhead - Số ngày tạo trước
     */
    static async initializeScheduleForBarber(barberId, daysAhead = 7) {
        try {
            const barber = await Barber.findById(barberId).select('_id preferredWorkingHours isAvailable');
            
            if (!barber || !barber.isAvailable) {
                console.log(`[ScheduleInitializer] Barber ${barberId} không tồn tại hoặc không hoạt động`);
                return;
            }
            
            const dates = this.generateDateRange(daysAhead);
            let createdCount = 0;
            
            for (const date of dates) {
                const result = await this.createScheduleIfNotExists(barber, date);
                if (result.created) {
                    createdCount++;
                }
            }
            
            console.log(`[ScheduleInitializer] Tạo ${createdCount} schedule cho barber ${barberId}`);
            
        } catch (error) {
            console.error(`[ScheduleInitializer] Lỗi tạo schedule cho barber ${barberId}:`, error);
        }
    }
    
    /**
     * Xóa các schedule cũ (quá khứ) để tiết kiệm dung lượng
     * @param {number} daysToKeep - Số ngày giữ lại (mặc định 30 ngày)
     */
    static async cleanupOldSchedules(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const cutoffDateString = cutoffDate.toISOString().split('T')[0];
            
            const result = await BarberSchedule.deleteMany({
                date: { $lt: cutoffDateString }
            });
            
            console.log(`[ScheduleInitializer] Đã xóa ${result.deletedCount} schedule cũ trước ngày ${cutoffDateString}`);
            
        } catch (error) {
            console.error('[ScheduleInitializer] Lỗi khi xóa schedule cũ:', error);
        }
    }
    
    /**
     * Chạy job định kỳ để duy trì schedule
     * Tạo schedule mới và xóa schedule cũ
     */
    static async runMaintenanceJob() {
        console.log('[ScheduleInitializer] Bắt đầu job bảo trì schedule...');
        
        // Tạo schedule cho 7 ngày tới
        await this.initializeSchedules(7);
        
        // Xóa schedule cũ hơn 30 ngày
        await this.cleanupOldSchedules(30);
        
        console.log('[ScheduleInitializer] Hoàn thành job bảo trì schedule');
    }
}

module.exports = ScheduleInitializerService;
