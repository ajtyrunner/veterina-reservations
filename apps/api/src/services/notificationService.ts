import { PrismaClient } from '@prisma/client'
import { emailService, ReservationEmailData } from './emailService'
import { getCachedTenantTimezone } from '../utils/tenant'
import { getUserEmail } from '../utils/contact'

interface ReservationNotificationData {
  reservationId: string
  tenantId: string
  newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  oldStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  notifyBoth?: boolean
}

class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Send notification based on reservation status change
   */
  async sendReservationStatusNotification(data: ReservationNotificationData): Promise<boolean> {
    try {
      console.log(`📧 Processing notification for reservation ${data.reservationId}: ${data.oldStatus || 'NEW'} → ${data.newStatus}`)

      // Fetch complete reservation data with related entities
      const reservation = await this.prisma.reservation.findFirst({
        where: { 
          id: data.reservationId,
          tenantId: data.tenantId 
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          slot: {
            include: {
              room: {
                select: {
                  name: true,
                },
              },
              serviceType: {
                select: {
                  name: true,
                },
              },
            },
          },
          tenant: {
            select: {
              name: true,
              timezone: true,
            },
          },
        },
      })

      if (!reservation) {
        console.error(`❌ Reservation ${data.reservationId} not found`)
        return false
      }

      // Get tenant timezone for proper date formatting
      const tenantTimezone = await getCachedTenantTimezone(this.prisma, data.tenantId)

      // Build email data with contact resolution
      const customerEmail = await getUserEmail(reservation.userId, data.tenantId)
      const doctorEmail = await getUserEmail(reservation.doctor.userId, data.tenantId)
      
      if (!customerEmail || !doctorEmail) {
        console.error(`❌ Missing email addresses - customer: ${customerEmail}, doctor: ${doctorEmail}`)
        return false
      }
      
      const emailData: ReservationEmailData = {
        customerName: reservation.user.name || 'Zákazník',
        customerEmail: customerEmail,
        doctorName: reservation.doctor.user.name || 'Doktor',
        doctorEmail: doctorEmail,
        petName: reservation.petName || undefined,
        petType: reservation.petType || undefined,
        description: reservation.description || undefined,
        startTime: reservation.slot.startTime,
        endTime: reservation.slot.endTime,
        timezone: tenantTimezone,
        tenantName: reservation.tenant.name,
        status: data.newStatus,
        reservationId: reservation.id,
        room: reservation.slot.room?.name || undefined,
        serviceType: reservation.slot.serviceType?.name || undefined,
      }

      // Send appropriate notification based on status
      let success = false

      switch (data.newStatus) {
        case 'PENDING':
          // New reservation created - notify doctor
          success = await emailService.sendReservationCreatedNotification(emailData)
          break

        case 'CONFIRMED':
          // Reservation confirmed - notify customer
          success = await emailService.sendReservationConfirmedNotification(emailData)
          break

        case 'CANCELLED':
          // Reservation cancelled - notify customer and optionally doctor
          success = await emailService.sendReservationCancelledNotification(emailData, data.notifyBoth)
          break

        case 'COMPLETED':
          // Reservation completed - thank customer
          success = await emailService.sendReservationCompletedNotification(emailData)
          break

        default:
          console.warn(`⚠️ Unknown reservation status: ${data.newStatus}`)
          return false
      }

      if (success) {
        console.log(`✅ Notification sent successfully for reservation ${data.reservationId}`)
        
        // Log notification in database for audit trail
        await this.logNotification({
          reservationId: data.reservationId,
          tenantId: data.tenantId,
          type: `RESERVATION_${data.newStatus}`,
          recipient: data.newStatus === 'PENDING' ? doctorEmail : customerEmail,
          success: true,
        })
      } else {
        console.error(`❌ Failed to send notification for reservation ${data.reservationId}`)
        
        // Log failure for debugging
        await this.logNotification({
          reservationId: data.reservationId,
          tenantId: data.tenantId,
          type: `RESERVATION_${data.newStatus}`,
          recipient: data.newStatus === 'PENDING' ? doctorEmail : customerEmail,
          success: false,
        })
      }

      return success
    } catch (error) {
      console.error(`❌ Error sending reservation notification:`, error)
      return false
    }
  }

  /**
   * Send reminder notification for upcoming appointments
   */
  async sendReservationReminders(): Promise<number> {
    try {
      console.log('📧 Checking for reservations that need reminder notifications...')

      // Find confirmed reservations that are 24 hours away
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      const reservationsToRemind = await this.prisma.reservation.findMany({
        where: {
          status: 'CONFIRMED',
          slot: {
            startTime: {
              gte: tomorrow,
              lt: dayAfterTomorrow,
            },
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          slot: {
            include: {
              room: {
                select: {
                  name: true,
                },
              },
              serviceType: {
                select: {
                  name: true,
                },
              },
            },
          },
          tenant: {
            select: {
              name: true,
              timezone: true,
            },
          },
        },
      })

      console.log(`📊 Found ${reservationsToRemind.length} reservations for reminder notifications`)

      let successCount = 0

      for (const reservation of reservationsToRemind) {
        try {
          const tenantTimezone = await getCachedTenantTimezone(this.prisma, reservation.tenantId)

          // Get email addresses with fallbacks
          const customerEmail = await getUserEmail(reservation.userId, reservation.tenantId)
          const doctorEmail = await getUserEmail(reservation.doctor.userId, reservation.tenantId)
          
          if (!customerEmail) {
            console.warn(`⚠️ No email available for customer ${reservation.userId}, skipping reminder`)
            continue
          }

          const emailData: ReservationEmailData = {
            customerName: reservation.user.name || 'Zákazník',
            customerEmail: customerEmail,
            doctorName: reservation.doctor.user.name || 'Doktor',
            doctorEmail: doctorEmail || 'noreply@veterina.cz',
            petName: reservation.petName || undefined,
            petType: reservation.petType || undefined,
            description: reservation.description || undefined,
            startTime: reservation.slot.startTime,
            endTime: reservation.slot.endTime,
            timezone: tenantTimezone,
            tenantName: reservation.tenant.name,
            status: 'CONFIRMED',
            reservationId: reservation.id,
            room: reservation.slot.room?.name || undefined,
            serviceType: reservation.slot.serviceType?.name || undefined,
          }

          const success = await emailService.sendReservationReminderNotification(emailData)
          
          if (success) {
            successCount++
            
            // Log successful reminder
            await this.logNotification({
              reservationId: reservation.id,
              tenantId: reservation.tenantId,
              type: 'RESERVATION_REMINDER',
              recipient: customerEmail,
              success: true,
            })
          } else {
            // Log failed reminder
            await this.logNotification({
              reservationId: reservation.id,
              tenantId: reservation.tenantId,
              type: 'RESERVATION_REMINDER',
              recipient: customerEmail,
              success: false,
            })
          }
        } catch (error) {
          console.error(`❌ Error sending reminder for reservation ${reservation.id}:`, error)
        }
      }

      console.log(`✅ Sent ${successCount}/${reservationsToRemind.length} reminder notifications`)
      return successCount
    } catch (error) {
      console.error('❌ Error in sendReservationReminders:', error)
      return 0
    }
  }

  /**
   * Log notification attempt for audit trail
   */
  private async logNotification(data: {
    reservationId: string
    tenantId: string
    type: string
    recipient: string
    success: boolean
  }): Promise<void> {
    try {
      // We could create a notifications table for audit logging
      // For now, just console log with structured data
      console.log('📝 Notification log:', {
        reservationId: data.reservationId,
        tenantId: data.tenantId,
        type: data.type,
        recipient: data.recipient,
        success: data.success,
        timestamp: new Date().toISOString(),
      })

      // TODO: Store in database notifications table when implemented
      // await this.prisma.notification.create({
      //   data: {
      //     reservationId: data.reservationId,
      //     tenantId: data.tenantId,
      //     type: data.type,
      //     recipient: data.recipient,
      //     success: data.success,
      //     sentAt: new Date(),
      //   },
      // })
    } catch (error) {
      console.error('❌ Error logging notification:', error)
    }
  }

  /**
   * Test notification system
   */
  async testNotifications(): Promise<boolean> {
    try {
      console.log('🧪 Testing notification system...')
      
      // Test email service connection
      const emailTest = await emailService.testConnection()
      
      if (emailTest) {
        console.log('✅ Notification system test passed')
        return true
      } else {
        console.log('❌ Notification system test failed')
        return false
      }
    } catch (error) {
      console.error('❌ Error testing notifications:', error)
      return false
    }
  }
}

export { NotificationService, ReservationNotificationData } 