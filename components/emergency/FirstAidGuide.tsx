'use client'

import * as React from 'react'
import {
  AlertTriangle,
  Ban,
  BookOpen,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Phone,
  Siren,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CallConfirmDialog } from '@/components/emergency/CallConfirmDialog'
import { EMERGENCY_SERVICES_NUMBER, AMBULANCE_NUMBER } from '@/lib/emergency'

/**
 * TASK 3 — First Aid Guide.
 *
 * Educational, general first-aid guidance only — NOT medical advice, diagnosis
 * or treatment. Content is adapted from the sources listed at the bottom of
 * the guide (NHS / NHS ambulance service pages, verified links) with Indian
 * emergency numbers (112 / 108) shown for calling. Every topic tells the user
 * to call emergency services first for serious situations.
 */

interface FirstAidTopic {
  id: string
  title: string
  signs: string
  steps: string[]
  warnings: string[]
  avoid: string[]
  source: { label: string; url: string }
}

const TOPICS: FirstAidTopic[] = [
  {
    id: 'heart-attack',
    title: 'Suspected heart attack',
    signs:
      'Chest pain or pressure (often centre or left), pain spreading to the arm(s), neck or jaw, cold sweat, breathlessness, feeling sick.',
    steps: [
      'Call 112 immediately — do not wait to see if the symptoms pass.',
      'Help the person sit and rest comfortably, with knees bent and back supported (on the floor with cushions if possible). Loosen tight clothing.',
      'Keep them calm and still, and stay with them until help arrives.',
      'If they have their own prescribed aspirin (300mg) and are not allergic to it, let them chew it slowly while waiting.',
      'If they become unresponsive and are not breathing normally, start CPR — 30 chest compressions followed by 2 rescue breaths if you are trained, chest compressions only otherwise.',
    ],
    warnings: [
      'Do not drive yourself to hospital — call 112 and wait for help.',
      'Heart attacks can look different in women, older people and people with diabetes: sudden breathlessness, nausea, cold sweat or extreme tiredness without classic chest pain still count.',
      'Be ready to act fast if they stop responding.',
    ],
    avoid: [
      'Do not dismiss the symptoms as indigestion or “just tiredness”.',
      'Do not give food or drink.',
      'Do not leave the person alone.',
    ],
    source: {
      label: 'NHS — Heart attack',
      url: 'https://www.nhs.uk/conditions/heart-attack/',
    },
  },
  {
    id: 'heavy-bleeding',
    title: 'Heavy bleeding',
    signs:
      'Blood is pouring or spurting from a wound, soaks through dressings, or does not stop with pressure. Pale, cold, clammy skin means shock is developing.',
    steps: [
      'Call 112 if the bleeding is heavy or does not stop — do it early.',
      'Press firmly on the wound with a clean cloth or gauze and keep up continuous, direct pressure.',
      'Raise the injured part above heart level if possible; if raising hurts, lay the person down instead.',
      'If blood soaks through, add another pad on top — never remove the first one.',
      'Once bleeding slows, bandage firmly in place and check fingers or toes every 10 minutes: they must stay warm and normal in colour.',
    ],
    warnings: [
      'Something embedded in the wound? Press on either side and pad around it — never pull it out.',
      'Signs of shock (pale, cold, clammy skin, fast breathing, dizziness): lie them down, raise the legs if you can, keep them warm and wait for the ambulance.',
      'A severed part should be wrapped in clean plastic, kept cool (not touching ice) and taken to hospital with the person.',
    ],
    avoid: [
      'Do not remove an object stuck in the wound.',
      'Do not probe or clean a deep wound while it is bleeding.',
      'Do not give food or drink.',
    ],
    source: {
      label: 'NHS — Cuts and grazes',
      url: 'https://www.nhs.uk/conditions/cuts-and-grazes/',
    },
  },
  {
    id: 'burns',
    title: 'Burns and scalds',
    signs:
      'Skin from hot objects, flames, steam, hot liquids, chemicals or electricity is red, blistered, white or charred and painful.',
    steps: [
      'Cool the burn under cool running water for a full 20 minutes — as soon as possible, ideally within 3 hours.',
      'Remove clothing or jewellery near the burn, but leave anything stuck to the skin in place.',
      'Once cooled, cover loosely with cling film laid over the burn, or a clean plastic bag — do not wrap tightly.',
      'Keep the person warm: cooling a large area (especially in babies, children and older adults) can cause hypothermia.',
      'Get medical help or call 112 for large or deep burns, burns to the face, hands, feet or genitals, any chemical or electrical burn, or a burn bigger than the person’s palm.',
    ],
    warnings: [
      'Do not burst blisters — they protect the skin underneath.',
      'Watch for infection later: increasing redness, swelling, pus or worsening pain needs medical attention.',
      'For chemical burns, rinse with cool running water for 20 minutes and take the chemical container with you.',
    ],
    avoid: [
      'No ice, butter, oils, creams or toothpaste on a burn.',
      'No sticky plasters or fluffy dressings directly on the burn.',
      'Do not burst blisters.',
    ],
    source: {
      label: 'NHS — Burns and scalds',
      url: 'https://www.nhs.uk/conditions/burns-and-scalds/',
    },
  },
  {
    id: 'choking',
    title: 'Choking',
    signs:
      'The person cannot speak, cough or breathe, clutches their throat, and their face may turn red then blue. Mild choking still allows coughing.',
    steps: [
      'Ask “Are you choking?” If they can still cough or speak, encourage them to cough it out.',
      'If they cannot cough, speak or breathe: stand behind them, lean them forward, and give up to 5 sharp back blows between the shoulder blades with the heel of your hand.',
      'Check if it cleared. If not, give up to 5 abdominal thrusts — fist just above the belly button, other hand on top, pull sharply inwards and upwards.',
      'Alternate 5 back blows with 5 thrusts. Call 112 if it is not clearing — tell the operator the person is choking.',
      'If they become unresponsive, lower them to the ground, call 112 and start CPR; check the mouth before each rescue breath.',
    ],
    warnings: [
      'Never give abdominal thrusts to a baby under 1 year or to a pregnant woman.',
      'Anyone who received abdominal thrusts must be seen by a doctor afterwards — internal injury is possible.',
      'Keep alternating back blows and thrusts until help arrives or the object clears.',
    ],
    avoid: [
      'Do not put your fingers into the mouth unless you can clearly see the object — you may push it further down or be bitten.',
      'Do not sweep blindly inside the mouth.',
      'Do not leave them alone while they are choking.',
    ],
    source: {
      label: 'NHS ambulance service — Choking',
      url: 'https://www.nwas.nhs.uk/services/emergency-advice/choking/',
    },
  },
  {
    id: 'fractures',
    title: 'Fractures (suspected broken bone)',
    signs:
      'Pain that gets worse when you move or touch it, swelling, bruising, a limb at an odd angle, grating feeling, or inability to use the limb.',
    steps: [
      'Call 112 for: a bone sticking out, an open wound over the injury, visible deformity, severe pain, or a suspected injury to the leg, hip, back or neck — do not move them.',
      'Do not move or straighten the limb — immobilise it exactly as you found it.',
      'Support it with a sling, splint or padding (clothing, blankets) and apply a cold pack wrapped in cloth for 15–20 minutes.',
      'Check beyond the injury every 10 minutes: skin colour, warmth and sensation must stay normal — loosen bandaging if it goes blue, cold or numb.',
      'Give nothing to eat or drink in case surgery is needed.',
    ],
    warnings: [
      'If a bone is sticking out, cover it with a clean dressing and press around it, not on it.',
      'Pale, cold, clammy skin or rapid breathing means shock — lie them down, keep them warm, call 112.',
      'If you are not sure whether it is broken, treat it as broken.',
    ],
    avoid: [
      'Do not straighten, “pop back” or test the limb.',
      'Do not give food or drink.',
      'Do not move someone with a suspected back, neck or hip injury.',
    ],
    source: {
      label: 'NHS — Broken arm or wrist',
      url: 'https://www.nhs.uk/conditions/broken-arm-or-wrist/',
    },
  },
  {
    id: 'unconsciousness',
    title: 'Unconsciousness',
    signs:
      'The person does not respond when you talk to or gently shake their shoulders. Gasping or irregular breathing is NOT normal breathing.',
    steps: [
      'Call 112 straight away and shout for help — do this before anything else.',
      'Check for response: tap the shoulders and shout “Are you alright?”.',
      'Open the airway: one hand on the forehead, gently tilt the head back, and lift the chin with two fingers.',
      'Check breathing for up to 10 seconds — look for the chest rising, listen for breath, feel it on your cheek.',
      'Breathing normally → roll them into the recovery position (near arm at a right angle, far hand to the cheek, roll them using the far knee) and keep checking breathing.',
      'Not breathing normally → start CPR now: 30 chest compressions (5–6 cm deep, 100–120 per minute) plus 2 rescue breaths if trained, compressions only otherwise. Use a nearby AED if one arrives.',
    ],
    warnings: [
      'Gasping is not breathing — treat it as cardiac arrest and start CPR.',
      'Suspected spinal injury: do not move the head or neck — only gently lift the jaw to open the airway.',
      'If the person is pregnant (over 28 weeks), place them on their side.',
    ],
    avoid: [
      'Do not leave the person alone.',
      'Do not put a pillow under the head of an unconscious person.',
      'Do not shake, slap or splash water to wake them.',
      'Do not mistake gasping for normal breathing.',
    ],
    source: {
      label: 'NHS 111 Wales — First aid (recovery position, CPR)',
      url: 'https://111.wales.nhs.uk/encyclopaedia/f/article/firstaid/',
    },
  },
]

const SOURCES = [
  { label: 'NHS — Heart attack', url: 'https://www.nhs.uk/conditions/heart-attack/' },
  { label: 'NHS — Cuts and grazes', url: 'https://www.nhs.uk/conditions/cuts-and-grazes/' },
  { label: 'NHS — Burns and scalds', url: 'https://www.nhs.uk/conditions/burns-and-scalds/' },
  {
    label: 'NHS ambulance service — Choking',
    url: 'https://www.nwas.nhs.uk/services/emergency-advice/choking/',
  },
  { label: 'NHS — Broken arm or wrist', url: 'https://www.nhs.uk/conditions/broken-arm-or-wrist/' },
  { label: 'NHS — Fainting', url: 'https://www.nhs.uk/symptoms/fainting/' },
  {
    label: 'NHS 111 Wales — First aid (CPR & recovery position)',
    url: 'https://111.wales.nhs.uk/encyclopaedia/f/article/firstaid/',
  },
]

export function FirstAidGuide() {
  const [callOpen, setCallOpen] = React.useState(false)

  return (
    <div>
      {/* Educational disclaimer + one-tap emergency call */}
      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="flex items-center gap-2 font-semibold text-red-900">
            <Siren className="h-5 w-5 shrink-0" aria-hidden="true" />
            Educational guide — not medical advice
          </p>
          <p className="mt-1 text-sm leading-relaxed text-red-700">
            General first-aid information adapted from NHS guidance. MyDoctor does not diagnose
            or treat. For any serious emergency, call emergency services first — dial{' '}
            <strong className="tabular-nums">{EMERGENCY_SERVICES_NUMBER}</strong> (ambulance:{' '}
            <strong className="tabular-nums">{AMBULANCE_NUMBER}</strong> where available).
          </p>
        </div>
        <Button
          variant="destructive"
          size="lg"
          className="shrink-0 gap-2"
          onClick={() => setCallOpen(true)}
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          {`Call ${EMERGENCY_SERVICES_NUMBER} now`}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {TOPICS.map((topic) => (
          <details
            key={topic.id}
            className="group rounded-2xl border border-secondary-200 bg-white transition-shadow hover:shadow-soft"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
              <span className="flex items-center gap-2.5 font-medium text-secondary-900">
                <ClipboardList className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                {topic.title}
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-secondary-400 transition-transform group-open:rotate-90"
                aria-hidden="true"
              />
            </summary>

            <div className="space-y-4 border-t border-secondary-200 px-5 py-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500">
                  How to recognise it
                </h4>
                <p className="mt-1 text-sm text-secondary-700">{topic.signs}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-secondary-500">
                  What to do
                </h4>
                <ol className="mt-2 space-y-2 text-sm text-secondary-700">
                  {topic.steps.map((step, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-700">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Important warnings
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-amber-900">
                  {topic.warnings.map((warning) => (
                    <li key={warning} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-800">
                  <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                  Do NOT
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-red-900">
                  {topic.avoid.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  href={topic.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 underline-offset-2 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Source: {topic.source.label}
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                </a>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setCallOpen(true)}
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {`Call ${EMERGENCY_SERVICES_NUMBER}`}
                </Button>
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* Sources */}
      <div className="mt-6 rounded-2xl border border-secondary-200 bg-white p-5">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-secondary-900">
          <BookOpen className="h-4 w-4 text-primary-600" aria-hidden="true" />
          Sources used for this guide
        </h4>
        <p className="mt-1 text-xs text-secondary-500">
          Adapted from public NHS (UK) first-aid guidance; emergency numbers shown are for India
          (112 / 108). This guide is for education only and is not a substitute for professional
          medical training or care.
        </p>
        <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
          {SOURCES.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary-700 underline-offset-2 hover:underline"
              >
                {source.label}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <CallConfirmDialog
        open={callOpen}
        label={`Call ${EMERGENCY_SERVICES_NUMBER} – Emergency Services`}
        number={EMERGENCY_SERVICES_NUMBER}
        onCancel={() => setCallOpen(false)}
      />
    </div>
  )
}
