alter table bookings add column if not exists reminder_sent boolean default false;

-- Permitir que qualquer pessoa (ou usuários autenticados) atualize os agendamentos (necessário para o Dashboard funcionar)
create policy "Allow public update bookings" on bookings for update using (true) with check (true);
create policy "Allow public delete bookings" on bookings for delete using (true);
