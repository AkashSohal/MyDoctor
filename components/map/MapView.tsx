'use client'

import * as React from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'
import { Doctor } from '@/lib/types'
import { MapPin, Stethoscope, Star, Building2 } from 'lucide-react'
import L from 'leaflet'

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const DoctorIcon = L.divIcon({
  className: 'doctor-marker',
  html: `
    <div class="doctor-marker-inner">
      <div class="doctor-marker-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
})

const UserIcon = L.divIcon({
  className: 'user-marker',
  html: `
    <div class="user-marker-inner">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

const HospitalIcon = L.divIcon({
  className: 'hospital-marker',
  html: `
    <div class="hospital-marker-inner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/>
        <path d="M12 15v4M12 11h.01M12 7h.01"/>
        <path d="M9 3v2M15 3v2"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

interface DoctorMarkerProps {
  doctor: Doctor
  onClick: () => void
  selected?: boolean
}

function DoctorMarker({ doctor, onClick, selected }: DoctorMarkerProps) {
  const position: [number, number] = doctor.latitude && doctor.longitude 
    ? [doctor.latitude, doctor.longitude] 
    : [0, 0]

  if (!doctor.latitude || !doctor.longitude) return null

  return (
    <Marker position={position} icon={selected ? DoctorIcon : DoctorIcon}>
      <Popup
        autoClose={false}
        closeOnClick={false}
        className="doctor-popup"
      >
        <div className="p-2 min-w-[200px]" onClick={onClick}>
          <div className="flex items-start gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-secondary-900 truncate">{doctor.full_name}</h4>
              <p className="text-sm text-secondary-500 truncate">{doctor.specialization?.name || 'Specialist'}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-secondary-500">
                {doctor.rating_average > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {doctor.rating_average.toFixed(1)}
                  </span>
                )}
                {doctor.distance_km && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {doctor.distance_km.toFixed(1)} km
                  </span>
                )}
              </div>
              {doctor.hospitals && doctor.hospitals.length > 0 && (
                <p className="mt-1 text-xs text-secondary-500 truncate">
                  <Building2 className="inline h-3 w-3 mr-1" />
                  {doctor.hospitals[0].name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="mt-2 w-full text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            View Profile
          </button>
        </div>
      </Popup>
    </Marker>
  )
}

interface MapViewProps {
  doctors: Doctor[]
  userLocation?: { lat: number; lng: number } | null
  hospitals?: { id: string; name: string; latitude: number; longitude: number }[]
  selectedDoctorId?: string
  onDoctorClick: (doctor: Doctor) => void
  onGetDirections?: (doctor: Doctor) => void
  className?: string
  height?: string
}

export function MapView({
  doctors,
  userLocation,
  hospitals = [],
  selectedDoctorId,
  onDoctorClick,
  onGetDirections,
  className,
  height = '500px',
}: MapViewProps) {
  const [mapCenter, setMapCenter] = React.useState<[number, number]>([12.9716, 77.5946])
  const [mapZoom, setMapZoom] = React.useState(12)

  const mapEvents = useMapEvents({
    moveend: () => {
      // This will be called when the map moves
      // We can't easily access the map instance here, so we'll skip updating center/zoom
    },
  })

  React.useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng])
    } else if (doctors.length > 0) {
      const validDoctors = doctors.filter(d => d.latitude && d.longitude)
      if (validDoctors.length > 0) {
        const avgLat = validDoctors.reduce((sum, d) => sum + (d.latitude || 0), 0) / validDoctors.length
        const avgLng = validDoctors.reduce((sum, d) => sum + (d.longitude || 0), 0) / validDoctors.length
        setMapCenter([avgLat, avgLng])
      }
    }
  }, [userLocation, doctors])

  return (
    <div className={cn('rounded-xl overflow-hidden border border-secondary-200', className)} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-medium text-secondary-900">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={[hospital.latitude, hospital.longitude]}
            icon={HospitalIcon}
          >
            <Popup>
              <div className="p-2 min-w-[180px]">
                <h4 className="font-semibold text-secondary-900">{hospital.name}</h4>
                <button
                  onClick={() => {}}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                >
                  View Hospital
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {doctors.map((doctor) => (
          <DoctorMarker
            key={doctor.id}
            doctor={doctor}
            selected={doctor.id === selectedDoctorId}
            onClick={() => onDoctorClick(doctor)}
          />
        ))}
      </MapContainer>
      
      <style jsx global>{`
        .doctor-marker-inner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: white;
          border: 3px solid #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        .doctor-marker:hover .doctor-marker-inner {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
        }
        .doctor-marker-icon {
          color: #22c55e;
        }
        .user-marker-inner {
          position: relative;
          width: 24px;
          height: 24px;
        }
        .user-marker-pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
          opacity: 0.6;
        }
        .user-marker-dot {
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #22c55e;
          border: 3px solid white;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        .hospital-marker-inner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          color: white;
        }
        .doctor-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        .doctor-popup .leaflet-popup-content {
          margin: 0;
        }
        .doctor-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </div>
  )
}

export function MiniMap({
  doctor,
  className,
}: {
  doctor: Doctor
  className?: string
}) {
  if (!doctor.latitude || !doctor.longitude) return null

  return (
    <div className={cn('rounded-xl overflow-hidden border border-secondary-200', className)} style={{ height: '200px' }}>
      <MapContainer
        center={[doctor.latitude, doctor.longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[doctor.latitude, doctor.longitude]} icon={DoctorIcon} />
      </MapContainer>
    </div>
  )
}