import { HttpInterceptorFn } from '@angular/common/http';

// TODO: Remover valores fixos quando o AuthService estiver finalizado
const TEMP_TOKEN = '$2y$10$FmKllH.1KDDchS.5gyFRDu6XPvxK623DDdfdsTPn3/CwnEA9C8SUa';
const TEMP_COMPANY_GROUP_ID = 'd354b40b-c56f-46a4-b033-33fcebdbac17';
const TEMP_USER_ID = '2c82dfba-10ae-11ec-a020-0242ac140002';
const TEMP_ACCESS_TYPE = 'user'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${TEMP_TOKEN}`,
      CompanyGroupId: TEMP_COMPANY_GROUP_ID,
      UserId: TEMP_USER_ID,
      'access-type': TEMP_ACCESS_TYPE
    },
  });
  return next(cloned);
};
