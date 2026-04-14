export interface Event {
  id: number;
  name: string;
  date: string;
  feeAmount: number;
  registrationDeadline: string;
}

export interface ChildInput {
  childName: string;
  birthYear: number;
  eventId: number;
}

export interface RegistrationRequest {
  parentName: string;
  phone: string;
  email: string;
  children: ChildInput[];
}

export interface RegistrationChildResult {
  id: number;
  childName: string;
  eventName: string;
  feeAmount: number;
}

export interface RegistrationResponse {
  orderId: number;
  paymentCode: string;
  totalAmount: number;
  children: RegistrationChildResult[];
}

export interface OrderChild {
  id: number;
  childName: string;
  eventName: string;
}

export interface OrderStatus {
  id: number;
  status: "pending" | "paid";
  paidAt: string | null;
  parentName: string;
  paymentCode: string;
  expectedAmount: number;
  children: OrderChild[];
}
