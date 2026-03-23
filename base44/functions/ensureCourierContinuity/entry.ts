import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Ensures courier assignment continuity throughout the shipment lifecycle.
 * - Maintains same courier for local deliveries
 * - Updates current_courier_id to reflect active handler
 * - Manages handoffs during intercity transits
 * - Validates courier availability and service areas
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shipment_id, new_status, handoff_data } = await req.json();

    if (!shipment_id) {
      return Response.json({ error: 'shipment_id is required' }, { status: 400 });
    }

    // Fetch shipment
    const shipment = await base44.entities.Shipment.get(shipment_id);
    if (!shipment) {
      return Response.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const updates = {};
    let courierChanged = false;

    // Handle status transitions and courier continuity
    if (new_status) {
      updates.status = new_status;

      // LOCAL DELIVERY - Maintain same courier throughout
      if (!shipment.requires_handoff) {
        // Ensure current_courier_id stays consistent for local deliveries
        if (!shipment.current_courier_id && shipment.local_courier_id) {
          updates.current_courier_id = shipment.local_courier_id;
          updates.current_courier_name = shipment.local_courier_name;
          courierChanged = true;
        }

        // Status-based validations for local delivery
        switch (new_status) {
          case 'picked_up':
          case 'in_transit':
          case 'out_for_delivery':
            // Verify courier hasn't changed
            if (shipment.current_courier_id && updates.current_courier_id && 
                shipment.current_courier_id !== updates.current_courier_id) {
              return Response.json({ 
                error: 'Cannot change courier during local delivery. Same courier must complete the delivery.' 
              }, { status: 400 });
            }
            break;

          case 'delivered':
            updates.actual_delivery_date = new Date().toISOString();
            break;
        }
      }

      // INTERCITY DELIVERY - Manage handoffs between couriers
      else {
        switch (new_status) {
          case 'assigned':
          case 'picked_up':
            // Initial pickup by intercity courier
            updates.current_courier_id = shipment.intercity_courier_id;
            updates.current_courier_name = shipment.intercity_courier_name;
            courierChanged = true;
            break;

          case 'in_transit':
            // Still with intercity courier during transit
            if (shipment.current_courier_id !== shipment.intercity_courier_id) {
              updates.current_courier_id = shipment.intercity_courier_id;
              updates.current_courier_name = shipment.intercity_courier_name;
              courierChanged = true;
            }
            break;

          case 'awaiting_handoff':
            // Package arrived at handoff location, still with intercity courier
            if (handoff_data?.handoff_location) {
              updates.handoff_location = handoff_data.handoff_location;
            }
            if (handoff_data?.handoff_notes) {
              updates.handoff_notes = handoff_data.handoff_notes;
            }
            // Courier stays as intercity until handoff confirmed
            break;

          case 'handoff_complete':
            // Transfer to local courier
            if (!shipment.local_courier_id) {
              return Response.json({ 
                error: 'Local courier not assigned. Cannot complete handoff.' 
              }, { status: 400 });
            }
            
            updates.current_courier_id = shipment.local_courier_id;
            updates.current_courier_name = shipment.local_courier_name;
            updates.handoff_time = new Date().toISOString();
            courierChanged = true;

            // Add tracking update for handoff
            const handoffUpdate = {
              timestamp: new Date().toISOString(),
              status: 'handoff_complete',
              location: shipment.handoff_location || shipment.delivery_town,
              courier_name: shipment.local_courier_name,
              notes: `Package handed off from ${shipment.intercity_courier_name} to ${shipment.local_courier_name}`
            };
            updates.tracking_updates = [...(shipment.tracking_updates || []), handoffUpdate];
            break;

          case 'out_for_delivery':
            // Must be with local courier for final delivery
            if (shipment.current_courier_id !== shipment.local_courier_id) {
              updates.current_courier_id = shipment.local_courier_id;
              updates.current_courier_name = shipment.local_courier_name;
              courierChanged = true;
            }
            break;

          case 'delivered':
            // Final delivery by local courier
            if (shipment.current_courier_id !== shipment.local_courier_id) {
              return Response.json({ 
                error: 'Final delivery must be completed by the local courier.' 
              }, { status: 400 });
            }
            updates.actual_delivery_date = new Date().toISOString();
            break;
        }
      }
    }

    // VALIDATE COURIER ASSIGNMENTS
    if (updates.current_courier_id) {
      const courier = await base44.entities.Courier.get(updates.current_courier_id);
      
      if (!courier) {
        return Response.json({ error: 'Assigned courier not found' }, { status: 404 });
      }

      if (courier.status !== 'active') {
        return Response.json({ 
          error: `Courier ${courier.full_name} is not active. Status: ${courier.status}` 
        }, { status: 400 });
      }

      // Validate courier service area for intercity vs local
      if (shipment.requires_handoff) {
        if (updates.current_courier_id === shipment.intercity_courier_id) {
          // Intercity courier should have 'intercity' or 'both' type
          if (courier.courier_type === 'local') {
            return Response.json({ 
              error: `Courier ${courier.full_name} is local-only and cannot handle intercity transit` 
            }, { status: 400 });
          }
        } else if (updates.current_courier_id === shipment.local_courier_id) {
          // Local courier should service the destination town
          if (courier.service_towns && !courier.service_towns.includes(shipment.delivery_town)) {
            return Response.json({ 
              error: `Courier ${courier.full_name} does not service ${shipment.delivery_town}` 
            }, { status: 400 });
          }
        }
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await base44.entities.Shipment.update(shipment_id, updates);
    }

    return Response.json({ 
      success: true, 
      shipment_id,
      courier_changed: courierChanged,
      current_courier: updates.current_courier_name || shipment.current_courier_name,
      status: updates.status || shipment.status,
      message: courierChanged 
        ? `Courier updated to ${updates.current_courier_name}` 
        : 'Shipment updated successfully'
    });

  } catch (error) {
    console.error('Courier continuity error:', error);
    return Response.json({ 
      error: error.message || 'Failed to ensure courier continuity' 
    }, { status: 500 });
  }
});